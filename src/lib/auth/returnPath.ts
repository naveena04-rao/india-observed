const fallbackReturnPath = "/events";

export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallbackReturnPath;

  try {
    const url = new URL(value, "https://india-observed.invalid");
    if (url.origin !== "https://india-observed.invalid") return fallbackReturnPath;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallbackReturnPath;
  }
}
