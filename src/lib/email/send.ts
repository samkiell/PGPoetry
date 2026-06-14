import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { env, isEmailEnabled } from "@/lib/env";

/**
 * Thin wrapper around Resend.
 *
 * If RESEND_API_KEY is unset, email is "disabled": instead of sending we log a
 * notice to the server console so the auth flows remain testable in local dev
 * without an API key. Calls never throw on a delivery failure — they return a
 * result so callers can decide what to surface to the user.
 */

const resend = isEmailEnabled ? new Resend(env.RESEND_API_KEY) : null;

export type SendResult =
  | { ok: true }
  | { ok: false; error: string };

interface SendEmailArgs {
  to: string;
  subject: string;
  react: ReactElement;
  /** Plain-text bits worth surfacing in the dev console (e.g. the OTP). */
  devPreview?: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  devPreview,
}: SendEmailArgs): Promise<SendResult> {
  if (!resend) {
    // Dev fallback: no provider configured.
    console.info(
      `[email] (disabled) would send "${subject}" to ${to}` +
        (devPreview ? ` — ${devPreview}` : ""),
    );
    return { ok: true };
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    react,
  });

  if (error) {
    console.error("[email] send failed:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

interface SendBroadcastArgs {
  /** Recipients, hidden from one another. Max ~50 per call (Resend limit). */
  bcc: string[];
  subject: string;
  react: ReactElement;
  devPreview?: string;
}

/**
 * Sends one email to many recipients via BCC, so they never see each other's
 * addresses. `to` is set to the sender itself (a common pattern for BCC-only
 * blasts). Same dev-fallback behaviour as sendEmail.
 */
export async function sendBroadcast({
  bcc,
  subject,
  react,
  devPreview,
}: SendBroadcastArgs): Promise<SendResult> {
  if (bcc.length === 0) return { ok: true };

  if (!resend) {
    console.info(
      `[email] (disabled) would broadcast "${subject}" to ${bcc.length} recipient(s)` +
        (devPreview ? ` — ${devPreview}` : ""),
    );
    return { ok: true };
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: env.EMAIL_FROM,
    bcc,
    subject,
    react,
  });

  if (error) {
    console.error("[email] broadcast failed:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
