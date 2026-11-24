import { useEffect, useState } from "react";

export function Pwa() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if (!__DEV__ && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation may be disabled by browser policy; the online app still works.
      });
    }
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return offline ? (
    <div className="offline-banner" role="status">
      You’re offline. Reconnect to sign in or analyse a statement.
    </div>
  ) : null;
}
