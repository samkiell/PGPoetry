import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "./layout";

/** Warm onboarding email sent once an account's email is verified. */
export function Welcome({
  name,
  poemsUrl,
}: {
  name: string;
  poemsUrl: string;
}) {
  return (
    <EmailLayout
      preview="Welcome to PGpoetry"
      heading={name ? `Welcome, ${name}` : "Welcome to PGpoetry"}
    >
      <Text style={sharedStyles.paragraph}>
        Your email is verified and your account is ready. PGpoetry is a quiet
        space for original poetry — read it, save the lines that find you, and
        come back whenever you need them.
      </Text>
      <Section style={{ textAlign: "center", margin: "8px 0 20px" }}>
        <Button href={poemsUrl} style={sharedStyles.button}>
          Start reading
        </Button>
      </Section>
      <Text style={sharedStyles.muted}>
        Every verse, a priceless gift.
      </Text>
    </EmailLayout>
  );
}

export default Welcome;
