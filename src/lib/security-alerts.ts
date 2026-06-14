import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { sendEmail } from "@/lib/email/send";
import { NewSignin } from "@/lib/email/templates/new-signin";

/**
 * On sign-in, fingerprint the device (user-agent + IP network) and email a
 * "new sign-in" alert the first time we see it. The fingerprint is hashed and
 * stored on the user so repeat sign-ins from the same device stay quiet.
 *
 * Best-effort: any failure is swallowed so it can never block authentication.
 */
export async function recordSignInAndAlert(userId: string): Promise<void> {
  try {
    const h = await headers();
    const ua = h.get("user-agent") ?? "unknown";
    const ipRaw =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      "unknown";
    // Use only the network portion of the IP so a user's rotating last octet
    // (or IPv6 suffix) doesn't trigger a fresh alert on every sign-in.
    const ipNet = networkPrefix(ipRaw);
    const fingerprint = sha256(`${ua}::${ipNet}`);

    await connectDB();
    const user = await User.findById(userId).select("email name knownDevices");
    if (!user?.email) return;

    if (user.knownDevices?.includes(fingerprint)) return; // already known

    // First sign-in ever (account just created) shouldn't fire an alert —
    // there's no "previous" device to contrast with.
    const isFirstEver = !user.knownDevices || user.knownDevices.length === 0;

    user.knownDevices = [...(user.knownDevices ?? []), fingerprint].slice(-20);
    await user.save();

    if (isFirstEver) return;

    void sendEmail({
      to: user.email,
      subject: "New sign-in to your PGpoetry account",
      react: NewSignin({
        when: new Date().toUTCString(),
        device: summarizeUserAgent(ua),
        location: ipRaw === "unknown" ? "Unknown" : `IP ${ipRaw}`,
      }),
      devPreview: `new sign-in alert (${summarizeUserAgent(ua)})`,
    });
  } catch (err) {
    console.error("[security-alerts] sign-in alert failed:", err);
  }
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function networkPrefix(ip: string): string {
  if (ip.includes(".")) return ip.split(".").slice(0, 3).join("."); // IPv4 /24
  if (ip.includes(":")) return ip.split(":").slice(0, 4).join(":"); // IPv6 /64
  return ip;
}

/** Coarse, human-readable device label from a user-agent string. */
function summarizeUserAgent(ua: string): string {
  const os =
    /Windows/i.test(ua) ? "Windows" :
    /Macintosh|Mac OS/i.test(ua) ? "macOS" :
    /Android/i.test(ua) ? "Android" :
    /iPhone|iPad|iOS/i.test(ua) ? "iOS" :
    /Linux/i.test(ua) ? "Linux" : "Unknown OS";
  const browser =
    /Edg\//i.test(ua) ? "Edge" :
    /OPR\/|Opera/i.test(ua) ? "Opera" :
    /Chrome\//i.test(ua) ? "Chrome" :
    /Firefox\//i.test(ua) ? "Firefox" :
    /Safari\//i.test(ua) ? "Safari" : "Unknown browser";
  return `${browser} on ${os}`;
}
