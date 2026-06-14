import { Button, Hr, Img, Section, Text } from "@react-email/components";
import { EmailLayout, sharedStyles } from "./layout";

/**
 * Broadcast sent to all readers when a new poem is published. Shows a glimpse
 * (excerpt) and links to the full poem on the site.
 */
export function NewPoem({
  title,
  glimpse,
  poemUrl,
  coverImage,
}: {
  title: string;
  glimpse: string;
  poemUrl: string;
  coverImage?: string;
}) {
  return (
    <EmailLayout
      preview={`New poem: ${title}`}
      heading="A new poem has been shared"
    >
      {coverImage ? (
        <Section style={{ margin: "0 0 16px" }}>
          <Img
            src={coverImage}
            alt={title}
            width="416"
            style={{
              borderRadius: "8px",
              width: "100%",
              height: "auto",
              objectFit: "cover",
            }}
          />
        </Section>
      ) : null}

      <Text style={titleStyle}>{title}</Text>

      <Text style={glimpseStyle}>{glimpse}</Text>

      <Hr style={{ borderColor: "#1f2738", margin: "20px 0" }} />

      <Text style={sharedStyles.paragraph}>
        Read the full poem on PGpoetry:
      </Text>
      <Section style={{ textAlign: "center", margin: "8px 0 4px" }}>
        <Button href={poemUrl} style={sharedStyles.button}>
          Read it in full
        </Button>
      </Section>
    </EmailLayout>
  );
}

const titleStyle: React.CSSProperties = {
  color: "#ffffff",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "22px",
  fontWeight: 600,
  margin: "0 0 12px",
};

const glimpseStyle: React.CSSProperties = {
  color: "#cbd2e0",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "16px",
  fontStyle: "italic",
  lineHeight: "28px",
  margin: 0,
  whiteSpace: "pre-line",
};

export default NewPoem;
