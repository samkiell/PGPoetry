import { Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "./layout";

/**
 * Sent to BOTH the old and new address when an account's email changes, so a
 * hijacker can't silently move the account without the original owner knowing.
 */
export function EmailChanged({
  oldEmail,
  newEmail,
  /** "old" tailors the copy for the previous address (the safety net). */
  recipient,
}: {
  oldEmail: string;
  newEmail: string;
  recipient: "old" | "new";
}) {
  return (
    <EmailLayout
      preview="The email on your PGpoetry account was changed"
      heading="Your account email was changed"
    >
      <Text style={sharedStyles.paragraph}>
        The email address on your PGpoetry account was changed from{" "}
        <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>.
      </Text>
      {recipient === "old" ? (
        <Text style={sharedStyles.muted}>
          If you didn&apos;t make this change, someone may have access to your
          account. Contact support right away to recover it — this is the last
          message we&apos;ll send to this address.
        </Text>
      ) : (
        <Text style={sharedStyles.muted}>
          If you didn&apos;t make this change, secure your account immediately by
          resetting your password.
        </Text>
      )}
    </EmailLayout>
  );
}

export default EmailChanged;
