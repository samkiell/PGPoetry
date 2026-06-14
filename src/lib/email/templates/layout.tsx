import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/** Shared shell for every transactional email — keeps branding consistent. */
export function EmailLayout({
  preview,
  heading,
  children,
}: {
  preview: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section>
            <Text style={brand}>PGpoetry</Text>
            <Text style={tagline}>Every verse, a priceless gift.</Text>
          </Section>
          <Hr style={hr} />
          <Heading style={h1}>{heading}</Heading>
          {children}
          <Hr style={hr} />
          <Text style={footer}>
            PGpoetry · You received this because someone used this address on
            PGpoetry. If that wasn&apos;t you, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#0b0f1a",
  color: "#e7e9ee",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "32px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#111726",
  border: "1px solid #1f2738",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "480px",
  padding: "32px",
};

const brand: React.CSSProperties = {
  color: "#ffffff",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "22px",
  fontWeight: 600,
  margin: 0,
};

const tagline: React.CSSProperties = {
  color: "#8b93a7",
  fontSize: "13px",
  margin: "4px 0 0",
};

const h1: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: 600,
  margin: "8px 0 16px",
};

const hr: React.CSSProperties = {
  borderColor: "#1f2738",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
};

export const sharedStyles = {
  paragraph: {
    color: "#cbd2e0",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 16px",
  } as React.CSSProperties,
  code: {
    backgroundColor: "#0b0f1a",
    border: "1px solid #2a3346",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "30px",
    fontWeight: 700,
    letterSpacing: "8px",
    padding: "14px 20px",
    textAlign: "center" as const,
  } as React.CSSProperties,
  button: {
    backgroundColor: "#ff6b5e",
    borderRadius: "8px",
    color: "#1a1207",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 600,
    padding: "12px 24px",
    textDecoration: "none",
  } as React.CSSProperties,
  muted: {
    color: "#8b93a7",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "0 0 8px",
  } as React.CSSProperties,
};
