import { Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "./layout";

/** Confirmation sent once a password reset is completed. */
export function ResetComplete() {
  return (
    <EmailLayout
      preview="Your PGpoetry password was reset"
      heading="Your password was reset"
    >
      <Text style={sharedStyles.paragraph}>
        Your PGpoetry password was just reset successfully. You can now sign in
        with your new password.
      </Text>
      <Text style={sharedStyles.muted}>
        If you didn&apos;t do this, your account may be compromised — reset your
        password again immediately and review your account security.
      </Text>
    </EmailLayout>
  );
}

export default ResetComplete;
