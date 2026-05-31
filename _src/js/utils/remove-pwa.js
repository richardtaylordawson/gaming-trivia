const legacyCacheNames = ["rtd-gaming-trivia"]

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister()))
    )
    .catch(() => {})
}

if ("caches" in window) {
  caches
    .keys()
    .then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => legacyCacheNames.includes(cacheName))
          .map((cacheName) => caches.delete(cacheName))
      )
    )
    .catch(() => {})
}
