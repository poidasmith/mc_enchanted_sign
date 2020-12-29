
const { series } = require("gulp");

function clean(cb) {
    cb();
}

function build(cb) {
    cb();
}

exports.clean = clean;
exports.build = build;
exports.default = series(clean, build);