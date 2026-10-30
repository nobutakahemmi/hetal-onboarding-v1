import { escapeXml, unescapeXml } from "./escape.js";
import { publicFields } from "./fields.js";

/**
 * Indeed-shaped fields for one job. v0 does not serve this document.
 * The feed host comes later; tests use it to lock page and feed strings.
 */
export function buildJobXml(job, publicBaseUrl) {
  const fields = publicFields(job, publicBaseUrl);
  const tags = [
    ["title", fields.title],
    ["referencenumber", fields.referencenumber],
    ["url", fields.url],
    ["location", fields.location],
    ["city", fields.city],
    ["state", fields.state],
    ["postalcode", fields.postalcode],
    ["country", fields.country],
    ["salary", fields.pay],
    ["company", fields.company],
    ["description", fields.description],
  ];
  const body = tags
    .map(([tag, value]) => `    <${tag}>${escapeXml(value)}</${tag}>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>${escapeXml(fields.company)}</publisher>
  <job>
${body}
  </job>
</source>
`;
}

export function xmlText(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!match) {
    throw new Error(`Missing <${tag}>`);
  }
  return unescapeXml(match[1].trim());
}
