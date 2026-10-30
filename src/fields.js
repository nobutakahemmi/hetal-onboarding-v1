const REFERENCE = /^[A-Za-z0-9-]{1,64}$/;

const REQUIRED = [
  "referencenumber",
  "title",
  "company",
  "city",
  "state",
  "postalcode",
  "country",
  "pay",
  "description",
];

export function assertReference(referencenumber) {
  if (!REFERENCE.test(referencenumber)) {
    throw new Error("Reference numbers must be 1-64 letters, digits, or hyphens");
  }
}

/**
 * Origin with no path, query, or hash. The canonical job URL is this origin
 * plus /jobs/{referencenumber}.
 */
export function assertOrigin(publicBaseUrl) {
  let url;
  try {
    url = new URL(publicBaseUrl);
  } catch {
    throw new Error("PUBLIC_BASE_URL is not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("PUBLIC_BASE_URL must be http or https");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("PUBLIC_BASE_URL must be an origin with no path, query, or hash");
  }
  return url.origin;
}

/**
 * The strings that must match between the public page and the future Indeed
 * feed. Page and XML both render this object.
 */
export function publicFields(job, publicBaseUrl) {
  for (const key of REQUIRED) {
    if (typeof job[key] !== "string" || job[key].trim() === "") {
      throw new Error(`Job is missing ${key}`);
    }
  }
  assertReference(job.referencenumber);
  const origin = assertOrigin(publicBaseUrl);
  return {
    title: job.title,
    location: `${job.city}, ${job.state} ${job.postalcode}`,
    pay: job.pay,
    referencenumber: job.referencenumber,
    url: `${origin}/jobs/${job.referencenumber}`,
    company: job.company,
    description: job.description,
    city: job.city,
    state: job.state,
    postalcode: job.postalcode,
    country: job.country,
  };
}
