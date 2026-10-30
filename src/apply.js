/**
 * Build the single apply link from APPSFLYER_ONELINK_TEMPLATE.
 * The template must contain {referencenumber} and resolve to http(s).
 */
export function buildApplyUrl(template, referencenumber) {
  if (typeof template !== "string" || template.trim() === "") {
    throw new Error("APPSFLYER_ONELINK_TEMPLATE is required");
  }
  if (!template.includes("{referencenumber}")) {
    throw new Error("APPSFLYER_ONELINK_TEMPLATE must include {referencenumber}");
  }
  const href = template.replaceAll(
    "{referencenumber}",
    encodeURIComponent(referencenumber),
  );
  let url;
  try {
    url = new URL(href);
  } catch {
    throw new Error("APPSFLYER_ONELINK_TEMPLATE is not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("APPSFLYER_ONELINK_TEMPLATE must be http or https");
  }
  return url.href;
}
