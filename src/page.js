import { escapeHtml } from "./escape.js";
import { publicFields } from "./fields.js";

const STYLES = `
  :root { color-scheme: light; }
  body {
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    color: #1c1917;
    background: #fafaf9;
  }
  main { max-width: 40rem; margin: 0 auto; padding: 3rem 1.25rem 4rem; }
  .company, .ref { letter-spacing: 0.04em; text-transform: uppercase; font-family: system-ui, sans-serif; font-size: 0.75rem; }
  .company { margin: 0 0 0.5rem; color: #57534e; }
  h1 { font-size: 2rem; line-height: 1.2; margin: 0 0 1rem; font-weight: 600; }
  .location, .pay { font-family: system-ui, sans-serif; margin: 0.25rem 0; }
  .pay { font-size: 1.125rem; }
  .description { margin: 1.5rem 0; white-space: pre-wrap; line-height: 1.5; }
  .apply {
    display: inline-block;
    font-family: system-ui, sans-serif;
    background: #1c1917;
    color: #fafaf9;
    text-decoration: none;
    padding: 0.75rem 1.25rem;
  }
  .ref { margin-top: 2rem; color: #78716c; }
  .note { font-family: system-ui, sans-serif; color: #57534e; }
  ul { padding-left: 1.25rem; }
  a { color: #1c1917; }
`.replaceAll(/\s+/g, " ").trim();

function documentShell({ title, canonical, body }) {
  const canonicalTag = canonical
    ? `<link rel="canonical" href="${escapeHtml(canonical)}">`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
${canonicalTag}
<style>${STYLES}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
}

export function renderJobPage(job, { publicBaseUrl, applyUrl }) {
  const fields = publicFields(job, publicBaseUrl);
  const body = `
<p class="company">${escapeHtml(fields.company)}</p>
<h1 data-field="title">${escapeHtml(fields.title)}</h1>
<p class="location" data-field="location">${escapeHtml(fields.location)}</p>
<p class="pay" data-field="pay">${escapeHtml(fields.pay)}</p>
<p class="description" data-field="description">${escapeHtml(fields.description)}</p>
<a class="apply" href="${escapeHtml(applyUrl)}">Apply</a>
<p class="ref">Reference <span data-field="referencenumber">${escapeHtml(fields.referencenumber)}</span></p>
`.trim();
  return documentShell({
    title: `${fields.title} · ${fields.company}`,
    canonical: fields.url,
    body,
  });
}

export function renderIndexPage(jobList, publicBaseUrl) {
  const items = jobList
    .map((job) => {
      const fields = publicFields(job, publicBaseUrl);
      return `<li><a href="/jobs/${escapeHtml(fields.referencenumber)}">${escapeHtml(fields.title)}</a></li>`;
    })
    .join("\n");
  const body = `
<h1>Sample job pages</h1>
<p class="note">These listings are fixtures for the v0 page. They are not live openings.</p>
<ul>
${items}
</ul>
`.trim();
  return documentShell({ title: "Sample job pages", body });
}

export function renderNotFound() {
  const body = `
<h1>Job not found</h1>
<p class="note">No listing matches that reference number.</p>
<p><a href="/">Back to sample jobs</a></p>
`.trim();
  return documentShell({ title: "Job not found", body });
}
