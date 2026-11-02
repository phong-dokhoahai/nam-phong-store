import {
  applyUpdate,
  getPwaState,
  promptInstall,
  subscribePwa,
} from "@/lib/pwa/pwaStore";
import { useSyncExternalStore } from "react";

/** Install prompt and "new version" state of the PWA. */
export function usePwa() {
  const state = useSyncExternalStore(subscribePwa, getPwaState);
  return { ...state, applyUpdate, promptInstall };
}
