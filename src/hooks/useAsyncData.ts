import { isNetworkError } from "@/lib/offline/isNetworkError";
import { readSnapshot, writeSnapshot } from "@/lib/offline/offlineStore";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useEffect, useEffectEvent, useMemo, useState } from "react";

interface AsyncDataOptions<T> {
  initialData: T;
  /** Translated message used when the thrown error has no message. */
  errorMessage: string;
  /** Runs after each successful load, e.g. to pick a default selection. */
  onSuccess?: (data: T) => void;
  /**
   * Saves each successful result on the device under this key and shows the
   * saved copy when the network is down (ADMIN sessions only, see
   * `lib/offline/offlineStore`). Include every parameter of the request
   * (filters, page) so different requests never share a copy.
   */
  offlineKey?: string;
}

interface AsyncState<T> {
  data: T;
  error: string;
  /** When `data` is an offline copy: the time it was saved; otherwise null. */
  cachedAt: number | null;
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
  { initialData, errorMessage, onSuccess, offlineKey }: AsyncDataOptions<T>,
) {
  const [reloadCount, setReloadCount] = useState(0);
  const request = useMemo(
    () => ({ load, offlineKey, reloadCount }),
    [load, offlineKey, reloadCount],
  );
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: "",
    cachedAt: null,
    settledRequest: null,
  });

  const handleSuccess = useEffectEvent((data: T) => onSuccess?.(data));
  const fallbackMessage = useEffectEvent(() => errorMessage);

  useEffect(() => {
    if (!request.load) return;
    let isActive = true;
    const key = request.offlineKey;

    const loadOfflineCopy = async (error: unknown) => {
      if (!key || !isNetworkError(error)) return null;
      return readSnapshot<T>(key);
    };

    request.load().then(
      (data) => {
        if (!isActive) return;
        setState({ data, error: "", cachedAt: null, settledRequest: request });
        handleSuccess(data);
        if (key) void writeSnapshot(key, data);
      },
      async (error: unknown) => {
        const snapshot = await loadOfflineCopy(error);
        if (!isActive) return;

        if (snapshot) {
          setState({
            data: snapshot.data,
            error: "",
            cachedAt: snapshot.savedAt,
            settledRequest: request,
          });
          handleSuccess(snapshot.data);
          return;
        }

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
  const isShowingOfflineCopy = isSettled && state.cachedAt !== null;

  // Swap the offline copy for live data as soon as the connection is back.
  useEffect(() => {
    if (!isShowingOfflineCopy) return;
    const reloadWhenOnline = () => setReloadCount((count) => count + 1);
    window.addEventListener("online", reloadWhenOnline);
    return () => window.removeEventListener("online", reloadWhenOnline);
  }, [isShowingOfflineCopy]);

  return {
    data: state.data,
    /** Error of the current request only (cleared while reloading or skipped). */
    error: isSettled ? state.error : "",
    isLoading: request.load !== null && !isSettled,
    /** Save time of the offline copy being shown, or null for live data. */
    cachedAt: isShowingOfflineCopy ? state.cachedAt : null,
    /** Fetch again with the same parameters (e.g. retry button). */
    reload: () => setReloadCount((count) => count + 1),
    /** Apply a local change after a successful mutation, without refetching. */
    setData: (update: (current: T) => T) =>
      setState((current) => ({ ...current, data: update(current.data) })),
  };
}
