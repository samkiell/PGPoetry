import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "./layout";

export function ResetPassword({
  code,
  resetUrl,
  expiresMinutes,
}: {
  code: string;
  resetUrl: string;
  expiresMinutes: number;
}) {
  return (
    <EmailLayout
      preview={`Reset your PGpoetry password — code ${code}`}
      heading="Reset your password"
    >
      <Text style={sharedStyles.paragraph}>
        We received a request to reset your PGpoetry password. Click the button
        below to choose a new one:
      </Text>
      <Section style={{ textAlign: "center", margin: "8px 0 20px" }}>
        <Button href={resetUrl} style={sharedStyles.button}>
          Reset your password
        </Button>
      </Section>
      <Text style={sharedStyles.paragraph}>
        Or enter this code on the reset page:
      </Text>
      <Section style={{ textAlign: "center", margin: "8px 0 20px" }}>
        <span style={sharedStyles.code}>{code}</span>
      </Section>
      <Text style={sharedStyles.muted}>
        This link and code expire in {expiresMinutes} minutes. If you didn&apos;t
        request a password reset, you can safely ignore this email — your
        password won&apos;t change.
      </Text>
    </EmailLayout>
  );
}

export default ResetPassword;
