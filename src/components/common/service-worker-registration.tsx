"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour

          // Handle updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  console.log("New content available, please refresh.");
                } else {
                  // Content cached for offline use
                  console.log("Content cached for offline use.");
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}
