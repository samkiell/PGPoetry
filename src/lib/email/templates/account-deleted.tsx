import { Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "./layout";

/** Confirmation sent when an account is deleted. */
export function AccountDeleted({ name }: { name: string }) {
  return (
    <EmailLayout
      preview="Your PGpoetry account has been deleted"
      heading="Your account has been deleted"
    >
      <Text style={sharedStyles.paragraph}>
        {name ? `${name}, your` : "Your"} PGpoetry account and its associated
        data have been removed. We&apos;re sorry to see you go.
      </Text>
      <Text style={sharedStyles.muted}>
        If you didn&apos;t request this, or you believe it was a mistake, reply
        to this email and we&apos;ll help. You&apos;re always welcome to sign up
        again.
      </Text>
    </EmailLayout>
  );
}

export default AccountDeleted;
