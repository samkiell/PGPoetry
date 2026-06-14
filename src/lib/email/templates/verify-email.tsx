import { Section, Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "./layout";

export function VerifyEmail({
  code,
  expiresMinutes,
}: {
  code: string;
  expiresMinutes: number;
}) {
  return (
    <EmailLayout
      preview={`Your PGpoetry verification code is ${code}`}
      heading="Verify your email"
    >
      <Text style={sharedStyles.paragraph}>
        Welcome to PGpoetry. Enter this code to confirm your email address and
        finish setting up your account:
      </Text>
      <Section style={{ textAlign: "center", margin: "8px 0 20px" }}>
        <span style={sharedStyles.code}>{code}</span>
      </Section>
      <Text style={sharedStyles.muted}>
        This code expires in {expiresMinutes} minutes. If you didn&apos;t create
        a PGpoetry account, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default VerifyEmail;
