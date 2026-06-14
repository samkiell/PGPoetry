/**
 * Renders a JSON-LD <script> for structured data. Server component — emitted
 * into the HTML so crawlers see it without executing JS.
 *
 * The `<` escape prevents a `</script>` sequence inside string values from
 * breaking out of the script tag (the standard JSON-LD injection guard).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
