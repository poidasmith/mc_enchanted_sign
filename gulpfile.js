const gulp = require("gulp");
const transform = require("gulp-transform");
const header = require("gulp-header");
const footer = require("gulp-footer");
const concat = require("gulp-concat");
const path = require("path");
const del = require("del");
const zip = require("gulp-zip");
const os = require("os");
const log = require("fancy-log");
const glob = require("glob");

const username = os.userInfo().username;
const minecraftFolder = "C:\\Users\\" + username + "\\AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang";

/**
 * Clean the build folder
 */
function clean() {
    return del(["build/output", "build/generated"]);
};

/**
 * Grab all the .tpl files in the templates folder and concatenate into a map of name -> contents
 */
function buildTemplates() {
    return gulp.src("./src/scripts/server/templates/**.tpl")
        .pipe(transform("utf8", function (content, file) {
            var fileName = path.basename(file.path);
            var templateName = fileName.substring(0, fileName.length - 4);
            return "templates." + templateName + " = `\n" + String(content) + "`;\n";
        }))
        .pipe(concat("templates.js"))
        .pipe(header("let templates = {};\n\n"))
        .pipe(footer("\n"))
        .pipe(gulp.dest("./build/generated/scripts/server"));
};

/**
 * Grab all the .tpl files in the macros folder and concatenate into a map of name -> contents
 */
function buildMacros() {
    return gulp.src("./src/scripts/server/macros/**.tpl")
        .pipe(transform("utf8", function (content, file) {
            var fileName = path.basename(file.path);
            var templateName = fileName.substring(0, fileName.length - 4);
            return "macros." + templateName + " = `\n" + String(content) + "`;\n";
        }))
        .pipe(concat("macros.js"))
        .pipe(header("let macros = {};\n\n"))
        .pipe(footer("\n"))
        .pipe(gulp.dest("./build/generated/scripts/server"));
};

/**
 * Glue the server, templater and templates into a single file
 */
function buildServer() {
    // Concatenate in order of dependency
    var files = [
        "./build/generated/scripts/server/templates.js",
        "./build/generated/scripts/server/macros.js",
        "./src/scripts/server/templater.js",
        "./src/scripts/server/server.js",
    ];
    return gulp.src(files)
        .pipe(concat("server.js"))
        .pipe(gulp.dest("./build/output/scripts/server/"));
}

/**
 * Build the client script
 */
function buildClient() {
    return gulp.src("./src/scripts/client/client.js").pipe(gulp.dest("./build/output/scripts/client/"));
}

/**
 * Copy the manifest files into the output folder
 */
function buildManifest() {
    return gulp.src([
        "./src/manifest.json",
        "./src/pack_icon.png"
    ]).pipe(gulp.dest("./build/output"));
}

/**
 * Run our template test
 */
function test(cb) {
    require("./test/test");
    cb();
}

/**
 * Create the .mcpack file for distribution
 */
function makePack() {
    return gulp.src("./build/output/**/*").pipe(zip("EnchantedSign.mcpack")).pipe(gulp.dest("./build"));
}

/**
 * Copy the addon to the install addon dir for quick updating
 */
function installToLocalAddon() {
    var addonFolder = minecraftFolder + "\\behavior_packs\\EnchangedS";
    return gulp.src("./build/output/**").pipe(gulp.dest(addonFolder))
}

/**
 * Copy the addon into the folder of worlds with this addon already enabled
 */
function installToWorlds() {
    const worldsWithAddon = glob.sync(minecraftFolder + "\\minecraftWorlds\\**\\behavior_packs\\EnchangedS");
    var stream = gulp.src("./build/output/**");
    worldsWithAddon.forEach(function(folder) {
        stream = stream.pipe(gulp.dest(folder));
    });
    return stream;
}

/**
 * Watch for changes to code and install
 */
function autoInstall() {
    gulp.watch(["./src/**/*.js", "./src/**/*.tpl"], exports.install);
}

exports.clean = clean;
exports.default = gulp.series(buildTemplates, buildMacros, buildManifest, buildServer, buildClient);
exports.test = gulp.series(exports.default, test);
exports.package = gulp.series(makePack, installToLocalAddon, installToWorlds);
exports.install = gulp.series(exports.test, exports.package);
exports.worlds = installToWorlds;
exports.watch = autoInstall;
