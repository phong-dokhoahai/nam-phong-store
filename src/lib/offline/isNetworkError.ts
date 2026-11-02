const NETWORK_ERROR_PATTERN =
  /failed to fetch|networkerror|load failed|network request failed|fetch failed/i;

function messageOf(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

/**
 * True when a request failed because the server could not be reached (the
 * device is offline or the connection dropped), as opposed to the server
 * rejecting the request. Supabase reports fetch failures as
 * `{ message: "TypeError: Failed to fetch" }`.
 */
export function isNetworkError(error: unknown) {
  return !navigator.onLine || NETWORK_ERROR_PATTERN.test(messageOf(error));
}
