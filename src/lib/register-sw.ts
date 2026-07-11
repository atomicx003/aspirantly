// Registers the native service worker for installability.
// Never registers inside the Lovable editor/preview or in dev — those contexts
// hold on to stale caches and break the live preview.
export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const host = window.location.hostname;
  const inIframe = window.self !== window.top;
  const isPreview =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");
  const killSwitch = new URLSearchParams(window.location.search).get("sw") === "off";

  const shouldRegister = import.meta.env.PROD && !inIframe && !isPreview && !killSwitch;

  if (!shouldRegister) {
    // Clean up any previously registered worker in refused contexts.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        if (reg.active?.scriptURL.endsWith("/service-worker.js")) reg.unregister();
      });
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      /* registration is best-effort */
    });
  });
}
