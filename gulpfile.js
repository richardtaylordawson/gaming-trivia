const gulp = require("gulp")
const sass = require("gulp-sass")
const browserSync = require("browser-sync").create()
const imagemin = require("gulp-imagemin")
const cache = require("gulp-cache")
const del = require("del")
const runSequence = require("run-sequence")
const cleanCSS = require("gulp-clean-css")
const uglify = require("gulp-uglify")
const htmlmin = require("gulp-htmlmin")
const rollup = require("gulp-better-rollup")
const babel = require("rollup-plugin-babel")

gulp.task("images", () => {
  gulp
    .src("_src/images/**/*.+(png|jpg|jpeg|gif|svg)")
    .pipe(cache(imagemin()))
    .pipe(gulp.dest("dist/images"))

  return del.sync("dist/images")
})

gulp.task("js", () => {
  gulp
    .src("_src/sw.js")
    .pipe(rollup({ plugins: [babel()] }, { format: "cjs" }))
    .pipe(uglify())
    .pipe(gulp.dest("dist/"))

  gulp
    .src("_src/js/stats.js")
    .pipe(rollup({ plugins: [babel()] }, { format: "cjs" }))
    .pipe(uglify())
    .pipe(gulp.dest("dist/js"))

  return gulp
    .src("_src/js/gamingtrivia.js")
    .pipe(rollup({ plugins: [babel()] }, { format: "cjs" }))
    .pipe(uglify())
    .pipe(gulp.dest("dist/js"))
    .pipe(browserSync.reload({ stream: true }))
})

gulp.task("scss", () => {
  gulp
    .src("_src/scss/stats.scss")
    .pipe(sass())
    .pipe(cleanCSS())
    .pipe(gulp.dest("dist/css"))

  return gulp
    .src("_src/scss/gamingtrivia.scss")
    .pipe(sass())
    .pipe(cleanCSS())
    .pipe(gulp.dest("dist/css"))
    .pipe(browserSync.reload({ stream: true }))
})

gulp.task("html", () => {
  gulp
    .src("_src/**/*.html")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("dist/"))
    .pipe(browserSync.reload({ stream: true }))

  return del.sync("dist/**/*.html")
})

gulp.task("files", () => {
  gulp.src("_src/**/*.+(json|txt|xml)").pipe(gulp.dest("dist/"))

  return del.sync("dist/**/*.+(json|txt|xml)")
})

gulp.task("syncDist", () => del.sync("dist"))

gulp.task("browserSync", () =>
  browserSync.init({ server: { baseDir: "./dist" } })
)

gulp.task("watch", () => {
  gulp.watch("_src/images/**/*.+(png|jpg|jpeg|gif|svg)", ["images"])
  gulp.watch("_src/js/**/*.js", ["js"])
  gulp.watch("_src/scss/**/*.scss", ["scss"])
  gulp.watch("_src/**/*.html", ["html"])
  gulp.watch("_src/**/*.+(json|txt|xml)", ["files"])
})

gulp.task("build", (callback) => {
  runSequence(["images", "js", "scss", "html", "files"], callback)
})

gulp.task("default", (callback) => {
  runSequence(
    "syncDist",
    ["images", "js", "scss", "html", "files", "browserSync", "watch"],
    callback
  )
})
