import "server-only";
import crypto from "node:crypto";
import { connectDB } from "@/lib/db";
import {
  VerificationToken,
  type TokenPurpose,
} from "@/models/VerificationToken";

/**
 * Issue and verify one-time codes (6-digit) and URL tokens for email
 * verification and password reset. Secrets are stored hashed; comparisons use
 * constant-time equality. A small attempt cap blunts code brute-forcing.
 */

export const CODE_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** 6-digit numeric code, zero-padded, drawn from a CSPRNG. */
function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** URL-safe random token for the reset magic link. */
function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export interface IssuedToken {
  code: string;
  /** Only set for password-reset; used to build the magic link. */
  token?: string;
}

/**
 * Replace any existing tokens for (identifier, purpose) and issue a fresh one.
 * Returns the plaintext secrets so the caller can email them — they are never
 * persisted in the clear.
 */
export async function issueToken(
  identifier: string,
  purpose: TokenPurpose,
): Promise<IssuedToken> {
  await connectDB();
  const id = identifier.toLowerCase().trim();

  // Invalidate prior outstanding tokens of the same purpose.
  await VerificationToken.deleteMany({ identifier: id, purpose });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

  const token = purpose === "password-reset" ? generateToken() : undefined;

  await VerificationToken.create({
    identifier: id,
    purpose,
    codeHash: sha256(code),
    tokenHash: token ? sha256(token) : undefined,
    expiresAt,
  });

  return { code, token };
}

export type VerifyResult =
  | { ok: true; identifier: string }
  | { ok: false; error: string };

async function consumeIfValid(
  query: Record<string, unknown>,
  purpose: TokenPurpose,
  secret: string,
  field: "codeHash" | "tokenHash",
): Promise<VerifyResult> {
  await connectDB();

  const doc = await VerificationToken.findOne({ ...query, purpose });
  if (!doc) {
    return { ok: false, error: "This code is invalid or has expired." };
  }
  if (doc.expiresAt.getTime() < Date.now()) {
    await doc.deleteOne();
    return { ok: false, error: "This code has expired. Request a new one." };
  }
  if (doc.attempts >= MAX_ATTEMPTS) {
    await doc.deleteOne();
    return {
      ok: false,
      error: "Too many attempts. Request a new code and try again.",
    };
  }

  const stored = doc[field];
  if (!stored || !timingSafeEqualStr(stored, sha256(secret))) {
    doc.attempts += 1;
    await doc.save();
    return { ok: false, error: "Incorrect code. Please try again." };
  }

  const identifier = doc.identifier;
  // Single use — consume on success.
  await doc.deleteOne();
  return { ok: true, identifier };
}

/** Verify a 6-digit code for the given email + purpose. */
export async function verifyCode(
  identifier: string,
  purpose: TokenPurpose,
  code: string,
): Promise<VerifyResult> {
  return consumeIfValid(
    { identifier: identifier.toLowerCase().trim() },
    purpose,
    code.trim(),
    "codeHash",
  );
}

/** Verify a magic-link token (password-reset only). */
export async function verifyToken(token: string): Promise<VerifyResult> {
  return consumeIfValid(
    { tokenHash: sha256(token.trim()) },
    "password-reset",
    token.trim(),
    "tokenHash",
  );
}
