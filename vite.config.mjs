import {
  cpSync,
  copyFileSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const __dirname = dirname(fileURLToPath(import.meta.url))
const sourceRoot = resolve(__dirname, "_src")
const outputRoot = resolve(__dirname, "dist")

function copyStaticAssets() {
  const files = ["manifest.json", "robots.txt", "sitemap.xml", "sw.js"]

  return {
    name: "copy-static-assets",
    closeBundle() {
      cpSync(resolve(sourceRoot, "images"), resolve(outputRoot, "images"), {
        recursive: true,
      })

      files.forEach((file) => {
        copyFileSync(resolve(sourceRoot, file), resolve(outputRoot, file))
      })
    },
  }
}

function preserveRootStaticLinks() {
  const restoreLinks = (file) => {
    const htmlPath = resolve(outputRoot, file)
    const html = readFileSync(htmlPath, "utf8")
      .replaceAll("/assets/manifest.json", "/manifest.json")
      .replaceAll("/assets/favicon.png", "/images/favicon.png")

    writeFileSync(htmlPath, html)
  }

  return {
    name: "preserve-root-static-links",
    closeBundle() {
      restoreLinks("index.html")
      restoreLinks("stats/index.html")
      rmSync(resolve(outputRoot, "assets/manifest.json"), { force: true })
      rmSync(resolve(outputRoot, "assets/favicon.png"), { force: true })
    },
  }
}

export default defineConfig({
  root: sourceRoot,
  publicDir: false,
  plugins: [copyStaticAssets(), preserveRootStaticLinks()],
  build: {
    outDir: outputRoot,
    emptyOutDir: true,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      input: {
        gamingtrivia: resolve(sourceRoot, "index.html"),
        stats: resolve(sourceRoot, "stats/index.html"),
      },
      output: {
        entryFileNames: "js/[name].js",
        chunkFileNames: "js/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some((name) => name.endsWith(".css"))) {
            return "css/[name][extname]"
          }

          return "assets/[name][extname]"
        },
      },
    },
  },
})
