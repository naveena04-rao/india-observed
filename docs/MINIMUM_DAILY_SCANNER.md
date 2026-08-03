# Minimum daily scanner

The daily scanner is a private editorial-discovery path. It never publishes, changes an event,
approves media, writes to GitHub, sends email, or notifies followers. The scanner is scheduled for
`30 1 * * *` (07:00 IST), but both the database rollout gate and the Production environment flag
must remain off until an authorised editor completes a successful controlled Production readiness
run with at least two source successes and at least one private candidate.

## Selected sources

| Source                       | Connector | Exact URL                                                | Request limit                                                                | Selection basis                                                                                                                                                                                                                                                                                         |
| ---------------------------- | --------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NorthEast Now RSS            | RSS       | `https://www.nenow.in/feed`                              | One daily request plus one conditional retry for a temporary network failure | The domain occurs in the original reviewed source dataset. Its public RSS feed returned current items, requires no login or key, and its robots file explicitly allows all paths. Collection is limited to private metadata and canonical links; article bodies and public redistribution are excluded. |
| Press Information Bureau RSS | RSS       | `https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=6` | One daily request plus one conditional retry for a temporary network failure | The domain occurs in the original reviewed source dataset. PIB provides an official RSS endpoint and its copyright policy permits accurate attributed reuse without prior approval. No release page, PDF, image, or video is fetched.                                                                   |

The current PIB feed can be empty. An empty valid feed is a successful source response, not a
candidate and not a reason to fetch release pages.

## Evaluated but not selected

NDTV, Times of India, India Today, Indian Express, Hindustan Times, Onmanorama, and The News
Minute were excluded because their published RSS or site terms limit feeds/content to personal use
or require separate permission. NorthEast Now's article pages are not fetched. The reviewed Punjab,
Assam, Maharashtra, Uttar Pradesh, West Bengal, and Kerala government sitemaps were reachable but
had no current entries in the 48-hour window or unresolved access/reuse questions, so they were not
counted as useful daily sources.

## Run boundaries

- Previous 48 hours; at most five approved daily sources.
- At most 100 raw items, 50 stored items, 25 private candidates, and 230 seconds of application
  runtime.
- One temporary-network retry with bounded backoff; no retry for HTTP 401, 403, 404, or 429.
- Canonical URL, normalized title, publisher/timestamp, content fingerprint, and syndicated-title
  similarity deduplication.
- Matching against all 50 internal records with private signal, conflict, confidence, and chronology
  diagnostics.
- Source cooldown after three consecutive failures; one source failure does not stop the other.
- No approved source means the run fails closed.

## Rollout sequence

1. Apply the forward migration and deploy the reviewed application code.
2. Keep the scheduler disabled.
3. From the authorised editor dashboard, run one scanner readiness check.
4. Confirm at least two successful source responses, private candidates, deduplication, event
   matching, dashboard visibility, access denial, and unchanged public counts.
5. Only then satisfy the existing compliance gates and enable the Production scheduler flag once.

The digest schedule remains disabled.
