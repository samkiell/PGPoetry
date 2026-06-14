import { Schema, model, models, type Model, type Types } from "mongoose";

/**
 * One-time codes/tokens for email verification and password reset.
 *
 * The secret is stored only as a SHA-256 hash — the plaintext code/token lives
 * solely in the email. A TTL index auto-purges expired rows. `attempts` caps
 * brute-force guessing of the 6-digit code.
 *
 * Named distinctly from the Auth.js adapter's `verification_tokens` collection
 * (used for OAuth) so the two never collide.
 */

export type TokenPurpose = "email-verify" | "password-reset";

export interface VerificationTokenDoc {
  _id: Types.ObjectId;
  /** Lower-cased email the token belongs to. */
  identifier: string;
  purpose: TokenPurpose;
  /** SHA-256 hash of the 6-digit code. */
  codeHash: string;
  /** SHA-256 hash of the URL token (password-reset only). */
  tokenHash?: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const verificationTokenSchema = new Schema<VerificationTokenDoc>(
  {
    identifier: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: {
      type: String,
      enum: ["email-verify", "password-reset"],
      required: true,
    },
    codeHash: { type: String, required: true },
    tokenHash: { type: String, index: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "auth_tokens" },
);

// Auto-remove rows once expired.
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken: Model<VerificationTokenDoc> =
  (models.VerificationToken as Model<VerificationTokenDoc>) ||
  model<VerificationTokenDoc>("VerificationToken", verificationTokenSchema);
