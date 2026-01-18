// Simple sessionStorage-backed toast bus for cross-route notifications
export function pushToast(message) {
  try {
    const raw = sessionStorage.getItem("globalToasts");
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(message);
    sessionStorage.setItem("globalToasts", JSON.stringify(queue));
    // Notify listeners in the same tab to consume immediately
    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("global-toast-pushed"));
    }
  } catch {
    // ignore storage errors
  }
}

export function consumeToasts() {
  try {
    const raw = sessionStorage.getItem("globalToasts");
    if (!raw) return [];
    sessionStorage.removeItem("globalToasts");
    const queue = JSON.parse(raw);
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
}
