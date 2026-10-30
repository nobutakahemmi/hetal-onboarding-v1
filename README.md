# Hetal onboarding v1

Public job pages for Hetal listings. Indeed Job Sync needs each feed `url` to be a live page, and the page title, location, pay, and reference number have to match the feed. This repository is that page layer.

## v0

- One sample job at `/jobs/{referencenumber}` (`SAMPLE-1001`).
- The page shows pay and a single Apply link.
- Apply is built from `APPSFLYER_ONELINK_TEMPLATE`, which must contain `{referencenumber}`.
- Unknown reference numbers return 404.
- There is no SMS signup and no phone field.

The sample is a fixture. It is not a live opening and not a real pay rate.

## Not in this version

- Hosting the Indeed XML feed
- The weekly title engine
- ZIP expansion
- Live Indeed credentials

`src/xml.js` builds the feed fields for tests only. Nothing serves that XML yet. Tests require the page and the XML to use the same title, location, pay, reference number, and canonical URL. Pay is the `<salary>` text. The canonical URL is `PUBLIC_BASE_URL` plus `/jobs/{referencenumber}`.

## Private repository

Make this repository private before adding real postings, pay, ZIP coverage, or feed tokens. The sample fixture is safe to keep in git. Client data is not.

## Run

```bash
cp .env.example .env
npm start
```

Open [http://localhost:3000/jobs/SAMPLE-1001](http://localhost:3000/jobs/SAMPLE-1001).

Node 22 or newer (`nvm use` reads `.nvmrc`). There are no package dependencies.

## Environment

| Name | Purpose |
| --- | --- |
| `PUBLIC_BASE_URL` | Origin only, no path. Used for the canonical URL. |
| `APPSFLYER_ONELINK_TEMPLATE` | http(s) apply link with a `{referencenumber}` token. |
| `PORT` | Listen port. Defaults to 3000. |

`.env.example` uses a placeholder OneLink host, not a live AppsFlyer template.

## Test

```bash
npm test
```
