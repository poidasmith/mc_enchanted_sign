/*

MIT License

Copyright (c) 2020 poidasmith

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

let templater = {};

templater.fill = function (templateName, position, direction) {

    system.logf("Generating template '{0}' at {1} with direction {2}", templateName, JSON.stringify(position), direction);

    var template = templates[templateName];
    if (typeof (template) == "undefined")
        template = templates["house"];

    // Remove the sign
    system.create("air", position.x, position.y, position.z);

    // Split the template into tokens and layers
    var tokens = {};
    var layers = [];
    var lines = template.split("\n");
    var offset = { x: 0, y: 0, z: 0 };
    var base = null;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.trim().length == 0 || line.startsWith("#")) {
            continue;
        }
        // Look for 
        if (line.indexOf("=") !== -1) {
            var parts = line.split("=");
            var key = parts[0].trim();
            var value = parts[1].trim();
            tokens[key] = value;
        } else if (line.startsWith(" ")) {
            layers.push(line.trim().split("   ").map(s => s.split(" ")));
        } else if (line.startsWith("> offset ")) {
            var offsets = line.substring(9).trim().split(" ").map(s => parseInt(s));
            offset.x = offsets[0];
            offset.y = offsets[1];
            offset.z = offsets[2];
        } else if (line.startsWith("> base ")) {
            var parts = line.substring(7).trim().split(" ");
            base = { block: parts[0] };
            for (var z = 1; z < parts.length; z++) {
                var prop = parts[z].split(":");
                base[prop[0]] = prop[1];
            }
        }
    }

    // Calculate staring position and template size
    let updatedPosition = this.applyOffset(position, direction, offset);
    let { x: x0, y: y0, z: z0 } = updatedPosition;
    let depth = layers.length;
    let height = layers[0].length;
    let width = layers[0][0].length;

    // Fill the base layer if specified
    if (base) {
        var margin = parseInt(base.margin || "0");
        switch (direction) {
            case "north":
                var x1 = x0 - Math.ceil(width / 2) - margin;
                var x2 = x0 + Math.ceil(width / 2) + margin;
                var z1 = z0 - margin;
                var z2 = z0 + depth + margin;
                system.fill(base.block, x1, y0 - 1, z1, x2, y0 - 1, z2);
                break;
            case "south":
                var x1 = x0 - Math.ceil(width / 2) - margin;
                var x2 = x0 + Math.ceil(width / 2) + margin;
                var z1 = z0 + margin;
                var z2 = z0 - depth - margin;
                system.fill(base.block, x1, y0 - 1, z1, x2, y0 - 1, z2);
                break;
            case "east":
                var x1 = x0 - depth - margin;
                var x2 = x0 + margin;
                var z1 = z0 - Math.floor(width / 2) - margin;
                var z2 = z0 + Math.floor(width / 2) + margin;
                system.fill(base.block, x1, y0 - 1, z1, x2, y0 - 1, z2)
                break;
            case "west":
                var x1 = x0 + depth + margin;
                var x2 = x0 - margin;
                var z1 = z0 + Math.floor(width / 2) + margin;
                var z2 = z0 - Math.floor(width / 2) - margin;
                system.fill(base.block, x1, y0 - 1, z1, x2, y0 - 1, z2)
                break;
        }
    }

    // Loop through layers and fill in tokens
    for (i = 0; i < depth; i++) {
        for (j = 0; j < height; j++) {
            for (k = 0; k < width; k++) {
                var key = layers[i][j][k];
                var token = tokens[key];
                if (typeof (token) === "undefined") {
                    system.logf("Missing key {0}", key);
                    token = "magenta_glazed_terracotta"; // missing a key, make it stand out
                }

                // Check for fill or summon
                var createFn = system.create;
                if (token.startsWith("$")) {
                    createFn = system.summon;
                    token = token.substring(1);

                    // Check for multiplier
                    var parts = token.split(" ");
                    if (parts.length > 1 && parts[1].startsWith("count")) { // $chicken count:4
                        var times = parseInt(parts[1].substring(6));
                        createFn = function (...args) {
                            for (var i = 0; i < times; i++)
                                system.summon(...args);
                        };
                        token = parts[0];
                    }
                }

                // Check if we need to rotate the block
                if (token.indexOf(" ") !== -1) {
                    var parts = token.split(" ");
                    token = parts[0];
                    var tileData = parts[1] || "2";
                    if (token.indexOf("stairs") !== -1)
                        token = system.format("{0} {1}", token, templater.rotateStairs(tileData, direction));
                    else if (token === "bed")
                        token = system.format("{0} {1}", token, templater.rotateBed(tileData, direction));
                    else if (token === "chest")
                        token = system.format("{0} {1}", token, templater.rotateChest(tileData, direction));
                    else if (token === "torch")
                        token = system.format("{0} {1}", token, templater.rotateTorch(tileData, direction));
                    else if (token === "fence_gate")
                        token = system.format("{0} {1}", token, templater.rotateFence(tileData, direction));
                }

                switch (direction) {
                    case "north":
                        var x = Math.ceil(x0 - (width / 2) + k);
                        var y = y0 + j;
                        var z = z0 + depth - i;
                        createFn(token, x, y, z);
                        break;
                    case "south":
                        var x = Math.floor(x0 + (width / 2) - k);
                        var y = y0 + j;
                        var z = z0 - depth + i;
                        createFn(token, x, y, z);
                        break;
                    case "east":
                        var z = Math.ceil(z0 - (width / 2) + k);
                        var y = y0 + j;
                        var x = x0 - depth + i;
                        createFn(token, x, y, z);
                        break;
                    case "west":
                        var z = Math.floor(z0 + (width / 2) - k);
                        var y = y0 + j;
                        var x = x0 + depth - i;
                        createFn(token, x, y, z);
                        break;
                }
            }
        }
    }
};

/**
 * Map the numeric direction from a sign to north/south/east/west text
 */
templater.directionTextOf = function (dir) {
    if (dir < 4)
        return "south";
    else if (dir < 8)
        return "west";
    else if (dir < 12)
        return "north";
    else if (dir < 16)
        return "east";
    return "north";
}

/**
 * Apply an offset given the initial position and direction
 */
templater.applyOffset = function (position, direction, offset) {
    let { x, y, z } = position;
    let { x: xd, y: yd, z: zd } = offset;
    y += yd;
    switch (direction) {
        case "north":
            x += xd;
            z += zd;
            break;
        case "south":
            x -= xd;
            z -= zd;
            break;
        case "east":
            x += zd;
            z += xd;
            break;
        case "west":
            x -= zd;
            z -= xd;
            break;
    };
    return { x: x, y: y, z: z };
};

/**
 * Rotate stair blocks given an initial tileData (stepping toward)
 * 0 = west
 * 1 = east
 * 2 = north
 * 3 = south
 */
templater.rotateStairs = function (tileData, direction) {
    const rotation = {
        "2": { "west": "0", "east": "1", "north": "2", "south": "3" },
        "3": { "west": "1", "east": "0", "north": "3", "south": "2" }
    };
    return rotation[tileData][direction] || "2";
};

templater.rotateBed = function (tileData, direction) {
    const rotation = {
        "0": { "west": "1", "east": "3", "south": "2", "north": "0" }
    };
    return rotation[tileData][direction] || "2";
}

templater.rotateChest = function (tileData, direction) {
    const rotation = {
        "2": { "west": "4", "east": "5", "south": "3", "north": "2" }
    };
    return rotation[tileData][direction] || "2";
}

templater.rotateTorch = function (tileData, direction) {
    const rotation = {
        "4": { "west": "2", "east": "1", "south": "3", "north": "4" }
    };
    return rotation[tileData][direction] || "2";
}

templater.rotateFence = function (tileData, direction) {
    const rotation = {
        "0": { "west": "1", "east": "1", "south": "0", "north": "0" },
        "1": { "west": "0", "east": "0", "south": "1", "north": "1" }
    };
    return rotation[tileData][direction] || "0";
}

