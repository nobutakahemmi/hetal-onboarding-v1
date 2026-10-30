import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";
import { buildApplyUrl } from "../src/apply.js";
import { escapeHtml } from "../src/escape.js";
import { publicFields } from "../src/fields.js";
import { jobs } from "../src/jobs.js";
import { renderJobPage } from "../src/page.js";
import { createHandler } from "../src/server.js";
import { buildJobXml, xmlText } from "../src/xml.js";

const publicBaseUrl = "https://jobs.example.com";
const onelinkTemplate = "https://example.onelink.me/abcd?pid=indeed&c={referencenumber}";
const sample = jobs[0];

function fieldText(html, name) {
  const match = html.match(new RegExp(`data-field="${name}"[^>]*>([^<]*)`));
  assert.ok(match, `missing data-field=${name}`);
  return match[1]
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

test("page and feed use the same title, location, pay, reference number, and url", () => {
  const fields = publicFields(sample, publicBaseUrl);
  const applyUrl = buildApplyUrl(onelinkTemplate, sample.referencenumber);
  const html = renderJobPage(sample, { publicBaseUrl, applyUrl });
  const xml = buildJobXml(sample, publicBaseUrl);

  assert.equal(fieldText(html, "title"), fields.title);
  assert.equal(fieldText(html, "location"), fields.location);
  assert.equal(fieldText(html, "pay"), fields.pay);
  assert.equal(fieldText(html, "referencenumber"), fields.referencenumber);
  assert.equal(xmlText(xml, "title"), fields.title);
  assert.equal(xmlText(xml, "location"), fields.location);
  assert.equal(xmlText(xml, "salary"), fields.pay);
  assert.equal(xmlText(xml, "referencenumber"), fields.referencenumber);
  assert.equal(xmlText(xml, "url"), fields.url);

  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/);
  assert.equal(canonical?.[1], fields.url);
  assert.equal(fields.location, "Austin, TX 78701");
  assert.equal(fields.url, "https://jobs.example.com/jobs/SAMPLE-1001");
});

test("job page has one apply link and no signup form", () => {
  const applyUrl = buildApplyUrl(onelinkTemplate, sample.referencenumber);
  const html = renderJobPage(sample, { publicBaseUrl, applyUrl });
  assert.ok(html.includes(`<a class="apply" href="${escapeHtml(applyUrl)}">Apply</a>`));
  assert.equal(html.match(/<form/g), null);
  assert.equal(html.match(/type="tel"/g), null);
  assert.equal(html.toLowerCase().includes("sms"), false);
});

test("markup escapes title characters that would break html or xml", () => {
  const job = {
    ...sample,
    referencenumber: "SAMPLE-1002",
    title: `Tom & <Jerry> "quotes"`,
  };
  const applyUrl = buildApplyUrl(onelinkTemplate, job.referencenumber);
  const html = renderJobPage(job, { publicBaseUrl, applyUrl });
  const xml = buildJobXml(job, publicBaseUrl);
  assert.equal(fieldText(html, "title"), job.title);
  assert.equal(xmlText(xml, "title"), job.title);
  assert.equal(html.includes("<Jerry>"), false);
  assert.equal(xml.includes("<Jerry>"), false);
});

test("apply template must be an http(s) url with the reference token", () => {
  assert.throws(() => buildApplyUrl("https://example.com/apply", "SAMPLE-1001"), /referencenumber/);
  assert.throws(() => buildApplyUrl("javascript:alert(1)?ref={referencenumber}", "SAMPLE-1001"), /http/);
  assert.equal(
    buildApplyUrl(onelinkTemplate, "A B"),
    "https://example.onelink.me/abcd?pid=indeed&c=A%20B",
  );
});

async function withServer() {
  const handler = createHandler({ publicBaseUrl, onelinkTemplate });
  const server = createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  return {
    base,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

test("known reference returns the sample page", async () => {
  const server = await withServer();
  try {
    const response = await fetch(`${server.base}/jobs/SAMPLE-1001`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Sample retail associate/);
    assert.match(html, /\$18 per hour/);
    assert.match(html, /Austin, TX 78701/);
    assert.match(html, /rel="canonical" href="https:\/\/jobs\.example\.com\/jobs\/SAMPLE-1001"/);
    assert.match(html, /href="https:\/\/example\.onelink\.me\/abcd\?pid=indeed&amp;c=SAMPLE-1001"/);
  } finally {
    await server.close();
  }
});

test("unknown and unsafe reference numbers return 404", async () => {
  const server = await withServer();
  try {
    const missing = await fetch(`${server.base}/jobs/DOES-NOT-EXIST`);
    assert.equal(missing.status, 404);
    const missingHtml = await missing.text();
    assert.match(missingHtml, /Job not found/);
    assert.equal(missingHtml.includes("$18 per hour"), false);

    const unsafe = await fetch(`${server.base}/jobs/SAMPLE-1001%3Cscript%3E`);
    assert.equal(unsafe.status, 404);

    const other = await fetch(`${server.base}/feed.xml`);
    assert.equal(other.status, 404);
  } finally {
    await server.close();
  }
});

test("index lists the sample job and does not host the feed", async () => {
  const server = await withServer();
  try {
    const response = await fetch(`${server.base}/`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /href="\/jobs\/SAMPLE-1001"/);
    assert.match(html, /not live openings/);
    assert.equal(html.includes("<salary>"), false);
  } finally {
    await server.close();
  }
});
