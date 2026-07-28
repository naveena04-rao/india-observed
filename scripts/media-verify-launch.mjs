import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { approvedMediaBySlug, publishedEventSlugs } from "./media-library.mjs";

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

try {
  const slugs = await publishedEventSlugs();
  const approved = await approvedMediaBySlug();
  const exceptions = JSON.parse(
    await readFile(resolve("data/media-launch-exceptions.json"), "utf8"),
  );
  if (!Array.isArray(exceptions)) throw new Error("Launch exception registry must be an array.");

  const exceptionBySlug = new Map();
  for (const exception of exceptions) {
    if (
      !slugs.includes(exception.eventSlug) ||
      typeof exception.reason !== "string" ||
      exception.reason.trim().length < 12 ||
      typeof exception.ownerApproval !== "string" ||
      exception.ownerApproval.trim().length < 3 ||
      !validDate(exception.reviewDate) ||
      !validDate(exception.expiryDate) ||
      exception.expiryDate < new Date().toISOString().slice(0, 10)
    ) {
      throw new Error(`Invalid or expired launch exception: ${exception.eventSlug ?? "unknown"}.`);
    }
    exceptionBySlug.set(exception.eventSlug, exception);
  }

  const uncovered = slugs.filter((slug) => !approved.has(slug) && !exceptionBySlug.has(slug));
  for (const slug of slugs) {
    console.log(
      `${slug}\t${
        approved.has(slug)
          ? "approved_media"
          : exceptionBySlug.has(slug)
            ? `owner_exception_until:${exceptionBySlug.get(slug).expiryDate}`
            : "BLOCKED"
      }`,
    );
  }
  if (uncovered.length > 0) {
    throw new Error(
      `Launch blocked: ${uncovered.length} published events lack approved media or an owner-approved exception.`,
    );
  }
  console.log(`Media launch verification passed for ${slugs.length} published events.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Media launch verification failed.");
  process.exitCode = 1;
}
