import { createHash } from "node:crypto";

export type ClusterSignals = {
  title: string;
  canonicalUrl: string;
  state: string | null;
  district: string | null;
  eventDate: string | null;
  actionType: string | null;
  affectedGroup: string | null;
  demand: string | null;
};

const ignored = new Set(["and", "for", "from", "india", "protest", "strike", "rally"]);
const tokens = (value: string | null) =>
  new Set(
    (value ?? "")
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(/\s+/)
      .filter((term) => term.length > 2 && !ignored.has(term)),
  );
const similarity = (left: string | null, right: string | null) => {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  return [...a].filter((term) => b.has(term)).length / Math.max(a.size, b.size);
};
const day = (value: string | null) => {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : null;
};

export function createEventClusterKey(input: ClusterSignals) {
  const material = [
    input.state,
    input.district,
    day(input.eventDate),
    input.actionType,
    input.affectedGroup,
    input.demand,
    input.title,
  ]
    .map((value) => [...tokens(value)].sort().join(" "))
    .join("|");
  return createHash("sha256").update(material).digest("hex");
}

export function representsSameEvent(left: ClusterSignals, right: ClusterSignals) {
  if (left.canonicalUrl === right.canonicalUrl) return true;
  if (left.state && right.state && left.state !== right.state) return false;
  if (left.district && right.district && left.district !== right.district) return false;
  if (left.actionType && right.actionType && left.actionType !== right.actionType) return false;
  const leftDay = day(left.eventDate);
  const rightDay = day(right.eventDate);
  if (leftDay && rightDay && leftDay !== rightDay) return false;
  const sharedSpecificContext = Math.max(
    similarity(left.affectedGroup, right.affectedGroup),
    similarity(left.demand, right.demand),
  );
  return similarity(left.title, right.title) >= 0.65 && sharedSpecificContext >= 0.34;
}
