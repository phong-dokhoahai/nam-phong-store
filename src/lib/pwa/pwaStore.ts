/**
 * PWA state outside React: service worker registration, "new version"
 * detection and the browser's install prompt. Components read it through
 * `usePwa()`; `registerServiceWorker()` runs once from `main.tsx`.
 */

/** Chromium-only event; not in the DOM lib types. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type PwaState = {
  /** A new build is installed and waiting; reload to use it. */
  isUpdateAvailable: boolean;
  /** The browser offered installation and the app is not installed yet. */
  canInstall: boolean;
};

/** Look for a new deploy this often while the app stays open. */
const UPDATE_CHECK_MS = 30 * 60_000;

let state: PwaState = { isUpdateAvailable: false, canInstall: false };
let waitingWorker: ServiceWorker | null = null;
let installPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function setState(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function subscribePwa(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPwaState() {
  return state;
}

function markWaiting(worker: ServiceWorker | null) {
  // Only an update when a worker already controls the page; the very first
  // install just starts caching.
  if (!worker || !navigator.serviceWorker.controller) return;
  waitingWorker = worker;
  setState({ isUpdateAvailable: true });
}

function watchRegistration(registration: ServiceWorkerRegistration) {
  markWaiting(registration.waiting);

  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    installing?.addEventListener("statechange", () => {
      if (installing.state === "installed") {
        markWaiting(installing);
      }
    });
  });

  const checkForUpdate = () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      registration.update().catch(() => {
        // Offline or server hiccup: the next check retries.
      });
    }
  };
  window.setInterval(checkForUpdate, UPDATE_CHECK_MS);
  document.addEventListener("visibilitychange", checkForUpdate);
}

export function registerServiceWorker() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event as BeforeInstallPromptEvent;
    setState({ canInstall: true });
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    setState({ canInstall: false });
  });

  // Dev server has no build manifest; a worker there would cache stale code.
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  let isReloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // Reload only when the user accepted an update, not on first install.
    if (!waitingWorker || isReloading) return;
    isReloading = true;
    window.location.reload();
  });

  const register = () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then(watchRegistration)
      .catch(() => {
        // The app works without offline support (e.g. private browsing).
      });
  };

  // Register after load so precaching does not compete with the first paint.
  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

/** Activates the waiting worker; the page reloads on `controllerchange`. */
export function applyUpdate() {
  if (waitingWorker) {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  } else {
    window.location.reload();
  }
}

/** Shows the browser install dialog. */
export async function promptInstall() {
  if (!installPrompt) return;
  const prompt = installPrompt;
  installPrompt = null;
  setState({ canInstall: false });
  await prompt.prompt();
}
