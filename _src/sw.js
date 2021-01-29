var cacheName = "rtd-gaming-trivia"
var filesToCache = [
  "/",
  "/index.html",
  "/stats/index.html",
  "/css/index.css",
  "/js/index.js",
]

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(filesToCache)
    })
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((response) => {
      return response || fetch(event.request)
    })
  )
})
