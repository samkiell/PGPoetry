import { Section, Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "./layout";

/** "Was this you?" alert sent when an account signs in from a new device. */
export function NewSignin({
  when,
  device,
  location,
}: {
  when: string;
  device: string;
  location: string;
}) {
  return (
    <EmailLayout
      preview="New sign-in to your PGpoetry account"
      heading="New sign-in detected"
    >
      <Text style={sharedStyles.paragraph}>
        Your PGpoetry account was just signed into from a device we
        haven&apos;t seen before:
      </Text>
      <Section style={{ margin: "0 0 16px" }}>
        <Text style={sharedStyles.muted}>When: {when}</Text>
        <Text style={sharedStyles.muted}>Device: {device}</Text>
        <Text style={sharedStyles.muted}>Approx. location: {location}</Text>
      </Section>
      <Text style={sharedStyles.muted}>
        If this was you, no action is needed. If it wasn&apos;t, reset your
        password right away and review your account security.
      </Text>
    </EmailLayout>
  );
}

export default NewSignin;
