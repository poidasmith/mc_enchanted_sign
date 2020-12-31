var gulp = require("gulp");
var data = require("gulp-data");
var transform = require("gulp-transform");
var header = require("gulp-header");
var footer = require("gulp-footer");
var concat = require("gulp-concat");
var log = require("fancy-log");
var path = require("path");
var del = require("del");
var zip = require("gulp-zip");
var os = require("os");

var username = os.userInfo().username;
var minecraftFolder = "C:\\Users\\" + username + "\\AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang";

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

function buildGenerated() {
    return gulp.src("./src/**/*.js").pipe(gulp.dest("./build/generated"));
};

/**
 * Glue the server, templater and templates into a single file
 */
function buildServer() {
    return gulp.src([
        "./build/generated/scripts/server/templates.js",
        "./build/generated/scripts/server/templater.js",
        "./build/generated/scripts/server/server.js",
    ])
        .pipe(concat("server.js"))
        .pipe(gulp.dest("./build/output/scripts/server/"));
}

/**
 * Build the client script
 */
function buildClient() {
    return gulp.src("./build/generated/scripts/client/client.js").pipe(gulp.dest("./build/output/scripts/client/"));
}

/**
 * Copy the manifest files into the output folder
 */
function buildManifest(cb) {
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
 * Copy the addon into the folder of our test world for quick updating
 */
function installToWorld() {
    var worldFolder = minecraftFolder + "\\minecraftWorlds\\TOnoXzYiGAA=\\behavior_packs\\EnchangedS";
    return gulp.src("./build/output/**").pipe(gulp.dest(worldFolder))
}

exports.clean = clean;
exports.default = gulp.series(buildTemplates, buildGenerated, buildManifest, buildServer, buildClient);
exports.test = gulp.series(exports.default, test);
exports.install = gulp.series(exports.test, makePack, installToLocalAddon, installToWorld);