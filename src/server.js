import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildApplyUrl } from "./apply.js";
import { loadEnvFile } from "./env.js";
import { assertOrigin, assertReference } from "./fields.js";
import { jobs } from "./jobs.js";
import { renderIndexPage, renderJobPage, renderNotFound } from "./page.js";

export function createHandler({ publicBaseUrl, onelinkTemplate, jobList = jobs }) {
  assertOrigin(publicBaseUrl);
  buildApplyUrl(onelinkTemplate, "sample");

  return function handler(req, res) {
    const method = req.method ?? "GET";
    if (method !== "GET" && method !== "HEAD") {
      send(res, method, 405, "Method not allowed", "text/plain; charset=utf-8");
      return;
    }

    let pathname;
    try {
      pathname = new URL(req.url ?? "/", publicBaseUrl).pathname;
    } catch {
      send(res, method, 400, "Bad request", "text/plain; charset=utf-8");
      return;
    }

    if (pathname === "/") {
      send(res, method, 200, renderIndexPage(jobList, publicBaseUrl), "text/html; charset=utf-8");
      return;
    }

    const match = pathname.match(/^\/jobs\/([^/]+)$/);
    if (!match) {
      send(res, method, 404, renderNotFound(), "text/html; charset=utf-8");
      return;
    }

    let referencenumber;
    try {
      referencenumber = decodeURIComponent(match[1]);
      assertReference(referencenumber);
    } catch {
      send(res, method, 404, renderNotFound(), "text/html; charset=utf-8");
      return;
    }

    const job = jobList.find((item) => item.referencenumber === referencenumber);
    if (!job) {
      send(res, method, 404, renderNotFound(), "text/html; charset=utf-8");
      return;
    }

    const applyUrl = buildApplyUrl(onelinkTemplate, job.referencenumber);
    send(
      res,
      method,
      200,
      renderJobPage(job, { publicBaseUrl, applyUrl }),
      "text/html; charset=utf-8",
    );
  };
}

function send(res, method, status, body, type) {
  const payload = Buffer.from(body);
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": payload.length,
    "X-Content-Type-Options": "nosniff",
  });
  res.end(method === "HEAD" ? undefined : payload);
}

export function startServer({ port, publicBaseUrl, onelinkTemplate }) {
  const server = createServer(createHandler({ publicBaseUrl, onelinkTemplate }));
  server.listen(port);
  return server;
}

function main() {
  loadEnvFile(path.join(process.cwd(), ".env"));
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("PORT must be an integer from 1 to 65535");
    process.exit(1);
  }
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
  const onelinkTemplate = process.env.APPSFLYER_ONELINK_TEMPLATE;
  if (!onelinkTemplate) {
    console.error("Set APPSFLYER_ONELINK_TEMPLATE. See .env.example.");
    process.exit(1);
  }
  const server = startServer({ port, publicBaseUrl, onelinkTemplate });
  server.on("listening", () => {
    console.log(`Job pages at ${publicBaseUrl}`);
  });
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main();
}
