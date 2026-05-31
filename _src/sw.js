const legacyCacheNames = ["rtd-gaming-trivia"]

self.addEventListener("install", (event) => {
  self.skipWaiting()

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => legacyCacheNames.includes(cacheName))
            .map((cacheName) => caches.delete(cacheName))
        )
      )
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim().then(() =>
      self.registration.unregister().then(() =>
        self.clients.matchAll({ type: "window" }).then((clients) =>
          Promise.all(clients.map((client) => client.navigate(client.url)))
        )
      )
    )
  )
})
