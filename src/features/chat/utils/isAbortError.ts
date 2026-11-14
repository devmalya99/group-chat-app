export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  return "name" in error && error.name === "AbortError";
}
