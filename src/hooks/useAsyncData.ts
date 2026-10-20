import { getErrorMessage } from "@/utils/getErrorMessage";
import { useEffect, useEffectEvent, useMemo, useState } from "react";

interface AsyncDataOptions<T> {
  initialData: T;
  /** Translated message used when the thrown error has no message. */
  errorMessage: string;
  /** Runs after each successful load, e.g. to pick a default selection. */
  onSuccess?: (data: T) => void;
}

interface AsyncState<T> {
  data: T;
  error: string;
  /** The request this state answers; still loading while it is not the current one. */
  settledRequest: object | null;
}

/**
 * Loads data for a screen and tracks loading / error / reload.
 *
 * `load` must be memoized (`useCallback`): a new function means a new request
 * (e.g. filters changed). Pass `null` to skip loading (e.g. invalid filters).
 * Stale responses from an earlier request are ignored.
 */
export function useAsyncData<T>(
  load: (() => Promise<T>) | null,
  { initialData, errorMessage, onSuccess }: AsyncDataOptions<T>,
) {
  const [reloadCount, setReloadCount] = useState(0);
  const request = useMemo(() => ({ load, reloadCount }), [load, reloadCount]);
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: "",
    settledRequest: null,
  });

  const handleSuccess = useEffectEvent((data: T) => onSuccess?.(data));
  const fallbackMessage = useEffectEvent(() => errorMessage);

  useEffect(() => {
    if (!request.load) return;
    let isActive = true;

    request.load().then(
      (data) => {
        if (!isActive) return;
        setState({ data, error: "", settledRequest: request });
        handleSuccess(data);
      },
      (error: unknown) => {
        if (!isActive) return;
        setState((current) => ({
          ...current,
          error: getErrorMessage(error, fallbackMessage()),
          settledRequest: request,
        }));
      },
    );

    return () => {
      isActive = false;
    };
  }, [request]);

  const isSettled = state.settledRequest === request;

  return {
    data: state.data,
    /** Error of the current request only (cleared while reloading or skipped). */
    error: isSettled ? state.error : "",
    isLoading: request.load !== null && !isSettled,
    /** Fetch again with the same parameters (e.g. retry button). */
    reload: () => setReloadCount((count) => count + 1),
    /** Apply a local change after a successful mutation, without refetching. */
    setData: (update: (current: T) => T) =>
      setState((current) => ({ ...current, data: update(current.data) })),
  };
}
