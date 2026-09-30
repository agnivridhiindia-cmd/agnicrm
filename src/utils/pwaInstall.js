// Utility for handling Progressive Web App (PWA) installation

let deferredPrompt = null;
const promptSubscribers = new Set();

export function isIosDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) || 
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

export function isAppInstalled() {
  if (typeof window === "undefined") return false;

  // 1. Running inside installed standalone PWA window
  if (isStandaloneMode()) return true;

  // 2. Previously installed flag in localStorage
  try {
    if (localStorage.getItem("agni_pwa_installed") === "true") {
      return true;
    }
  } catch (e) {}

  return false;
}

export function markAsInstalled() {
  try {
    localStorage.setItem("agni_pwa_installed", "true");
  } catch (e) {}
  deferredPrompt = null;
  notifySubscribers();
}

function notifySubscribers() {
  promptSubscribers.forEach((cb) => {
    try {
      cb({
        isPromptAvailable: Boolean(deferredPrompt),
        isInstalled: isAppInstalled(),
        isIos: isIosDevice(),
      });
    } catch (e) {
      console.error("Error in PWA subscriber:", e);
    }
  });
}

// Global listeners attached immediately at module load
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Prevent default mini-infobar or automatic prompt so we can trigger it from Client Dashboard button
    event.preventDefault();
    deferredPrompt = event;
    notifySubscribers();
  });

  window.addEventListener("appinstalled", () => {
    markAsInstalled();
  });

  // Check if browser already has installed related apps
  if ("getInstalledRelatedApps" in navigator) {
    navigator.getInstalledRelatedApps().then((relatedApps) => {
      if (Array.isArray(relatedApps) && relatedApps.length > 0) {
        markAsInstalled();
      }
    }).catch(() => {});
  }
}

export function getDeferredPrompt() {
  return deferredPrompt;
}

export function subscribePwaState(callback) {
  promptSubscribers.add(callback);
  // Send initial state immediately
  callback({
    isPromptAvailable: Boolean(deferredPrompt),
    isInstalled: isAppInstalled(),
    isIos: isIosDevice(),
  });

  return () => {
    promptSubscribers.delete(callback);
  };
}

export async function promptPwaInstall() {
  if (!deferredPrompt) {
    return { outcome: "unavailable" };
  }

  try {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult && choiceResult.outcome === "accepted") {
      markAsInstalled();
    }
    return choiceResult;
  } catch (err) {
    console.error("Error prompting PWA install:", err);
    return { outcome: "dismissed", error: err };
  } finally {
    deferredPrompt = null;
    notifySubscribers();
  }
}
