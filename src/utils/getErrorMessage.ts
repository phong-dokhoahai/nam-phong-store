/** Message of a thrown Error, or the given (translated) fallback. */
export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;
