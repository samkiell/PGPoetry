import { Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "./layout";

/**
 * Security notice sent after a password is set or changed. Lets the account
 * owner catch a change they didn't make.
 */
export function PasswordChanged({
  /** "set" for a first password (OAuth account), "changed" otherwise. */
  variant = "changed",
}: {
  variant?: "set" | "changed";
}) {
  const verb = variant === "set" ? "set" : "changed";
  return (
    <EmailLayout
      preview={`Your PGpoetry password was ${verb}`}
      heading={`Your password was ${verb}`}
    >
      <Text style={sharedStyles.paragraph}>
        This is a confirmation that the password for your PGpoetry account was
        just {verb}. You can now sign in with your email and password
        {variant === "set" ? ", in addition to Google." : "."}
      </Text>
      <Text style={sharedStyles.muted}>
        If you didn&apos;t do this, your account may be compromised — reset your
        password immediately and review your account security.
      </Text>
    </EmailLayout>
  );
}

export default PasswordChanged;
