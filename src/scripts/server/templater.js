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

let templater = {
    templateCache: {}, // used to store parsed templates
    macroCache: {} // used to store parsed macros
};

/**
 * Get the template for the given template name
 */
templater.templateOf = function (templateName) {
    var template = templater.templateCache[template] || templater.parseTemplate(templates[templateName]);
    if (typeof template === "object") {
        templater.templateCache[templateName] = template;
        return template;
    }

    return templater.parseTemplate(templates[templateName] || templates["help"]);
};

/**
 * Get the macro for the given macro name
 */
templater.macroOf = function (macroName) {
    return templater.parseTemplate(macros[macroName]);
};

/**
 * Executes fill commands for the given block template
 */
templater.fill = function (templateName, position, direction) {

    system.logf("Generating template '{0}' at {1} with direction {2}", templateName, JSON.stringify(position), direction);

    // Get the template
    const template = templater.templateOf(templateName);

    // Render the template
    templater.fillTemplate(template, position, direction);
};

/**
 * Executes a macro
 */
templater.macro = function (macroName, position, direction) {

    system.logf("Generating macro '{0}' at {1} with direction {2}", macroName, JSON.stringify(position), direction);

    // Get the macro
    const template = templater.macroOf(macroName);

    // Render the macro
    templater.fillMacro(template, position, direction);
};

/**
 * Iterate through the template layers and fill blocks for the given position and direction
 */
templater.fillTemplate = function (template, position, direction) {

    let { tokens, layers, depth, height, width, offset, terrain } = template;

    // Calculate starting position and template size
    let updatedPosition = this.applyOffset(position, direction, offset);
    let { x: x0, y: y0, z: z0 } = updatedPosition;

    // Fill the base layer if specified
    if (template.base)
        templater.fillBase(template, updatedPosition, direction);

    // Loop through layers and fill in tokens - we loop through twice, placing solid blocks first
    for (var mode of ["solid", "attachments"]) {
        for (var i = 0; i < depth; i++) {
            for (var j = 0; j < height; j++) {
                for (var k = 0; k < width; k++) {
                    var key = layers[i][j][k];
                    var token = tokens[key];
                    if (typeof token === "undefined") {
                        system.logf("Missing key {0}", key);
                        token = "magenta_glazed_terracotta"; // missing a key, make it stand out
                    }

                    // Check for solid vs attachment blocks
                    // - we only place attachment blocks (like torches) in second pass
                    var isAttachmentBlock = templater.isAttachmentBlock(token);
                    if ((isAttachmentBlock && mode === "solid") || (!isAttachmentBlock && mode === "attachments"))
                        continue;

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
                        else if (token === "vine")
                            token = system.format("{0} {1}", token, templater.rotateVine(tileData, direction));
                    }

                    // Calculate position of block
                    var y = y0 + j;
                    var x, z;
                    switch (direction) {
                        case "north":
                            x = Math.floor(x0 + (width / 2) - k);
                            z = z0 + depth - i;
                            break;
                        case "south":
                            x = Math.ceil(x0 - (width / 2) + k);
                            z = z0 - depth + i;
                            break;
                        case "east":
                            z = Math.ceil(z0 - (width / 2) + k);
                            x = x0 - depth + i;
                            break;
                        case "west":
                            z = Math.floor(z0 + (width / 2) - k);
                            x = x0 + depth - i;
                            break;
                    }

                    // Check for terrain, find the surface and adjust the y value for this layer
                    if(terrain && terrain.follow === "true") {
                        var surface = system.findTheSurface2(x, y, z);
                        y = surface + j + offset.y;
                    } 

                    // Fill the block with the specified block type
                    createFn(token, x, y, z);
                }
            }
        }
    }
};

/**
 * Loop through the grid and fill templates according to the macro grid
 */
templater.fillMacro = function (macro, position, direction) {

    let { tokens, layers, offset, depth, height, width, grid, terrain } = macro;

    // Calculate starting position and template size
    let updatedPosition = this.applyOffset(position, direction, offset);
    let { x: x0, y: y0, z: z0 } = updatedPosition;

    var spacing = grid ? parseInt(grid.spacing || "10") : 10;
    var dx = depth * spacing;
    var wx = width * spacing;
    var mid = Math.ceil(spacing / 2);
    var x1 = x0 + wx / 2;

    for (var i = 0; i < depth; i++) {
        var ix = i * spacing;
        for (var j = 0; j < height; j++) {
            for (var k = 0; k < width; k++) {
                var kx = k * spacing;
                var key = layers[i][j][k];
                var token = tokens[key];

                if (typeof token === "undefined") {
                    system.logf("Missing key {0}", key);
                    token = "question"; // missing a key, make it stand out
                }

                var templateDir = templater.rotateDirection(direction, "north");
                var tparts = token.split(" ");
                if (tparts.length > 1) {
                    token = tparts[0];
                    templateDir = templater.rotateDirection(direction, tparts[1]);
                }

                // Get width, depth of template
                var tokenTemplate = templater.templateOf(token);
                var centerX = Math.floor((spacing - tokenTemplate.width) / 2); 
                var centerZ = Math.floor((spacing - tokenTemplate.depth) / 2); 

                // Calculate position of template
                var templatePos = {};
                switch (direction) {
                    case "north":
                        templatePos.x = x1 - mid - kx;
                        templatePos.y = y0 + j;
                        templatePos.z = z0 + dx - ix - spacing;
                        switch (templateDir) {
                            case "south":
                                templatePos.z += spacing;
                                break;
                            case "east": 
                                templatePos.x 
                        }
                        break;
                    case "south":
                        templatePos.x = x1 - mid - kx;
                        templatePos.y = y0 + j;
                        templatePos.z = z0 + dx - ix + spacing;
                        break;
                    case "east":
                        templatePos.z = Math.ceil(z0 - (dw / 2) + kx);
                        templatePos.y = y0 + j;
                        templatePos.x = x0 - depth + ix;
                        break;
                    case "west":
                        templatePos.z = Math.floor(z0 + (dw / 2) - kx);
                        templatePos.y = y0 + j;
                        templatePos.x = x0 + depth - ix;
                        break;
                };

                // TODO: support for following terrain; find the surface for given templatePos and use that
                if(terrain && terrain.follow === "true") {
                    var surface = system.findTheSurface2(templatePos.x, templatePos.y, templatePos.z);
                    templatePos.y = surface + j + offset.y;
                }

                // Fill the template for the given position and direction
                templater.fill(token, templatePos, templateDir);
            }
        }
    }
};

/**
 * Parse a template string into tokens, layers and properties
 */
templater.parseTemplate = function (templateStr) {

    if (!templateStr)
        return null;

    // Split the template into tokens and layers
    var tokens = {};
    var layers = [];
    var lines = templateStr.split("\n");
    var offset = { x: 0, y: 0, z: 0 };
    var base = null;
    var grid = null;
    var terrain = null;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        // Check for comment lines
        if (line.trim().length == 0 || line.startsWith("#")) {
            continue;
        }
        // Look for variables
        if (line.indexOf("=") !== -1) {
            var parts = line.split("=");
            var key = parts[0].trim();
            var value = parts[1].trim();
            tokens[key] = value;
        } else if (line.startsWith(" ")) { // Layers start with at least one space    
            layers.push(line.trim().split("   ").map(s => s.split(" ")));
        } else if (line.startsWith("> offset ")) { // Look for offset feature
            var offsets = line.substring(9).trim().split(" ").map(s => parseInt(s));
            offset.x = offsets[0];
            offset.y = offsets[1];
            offset.z = offsets[2];
        } else if (line.startsWith("> base ")) { // Look for base (foundation layer) feature
            let { props } = templater.parseSetting(line);
            base = props;
        } else if (line.startsWith("> grid")) { // Look for grid settings (for macros only)
            let { props } = templater.parseSetting(line);
            grid = props;
        } else if (line.startsWith("> terrain")) { // Look for terrain settings (for macros only)
            let { props } = templater.parseSetting(line);
            terrain = props;
        }
    }

    // Calculate dimensions
    let depth = layers.length;
    let height = layers[0].length;
    let width = layers[0][0].length;

    return {
        tokens,
        layers,
        depth,
        height,
        width,
        offset,
        base,
        grid,
        terrain
    };
};

/**
 * Parse a setting line from a template/macro
 */
templater.parseSetting = function (line) {
    // remove "> "
    line = line.substring(3).trim();
    var parts = line.split(" ");
    var command = parts[0];
    var props = {};
    parts.slice(1).forEach(function (part) {
        var p = part.split(":");
        props[p[0]] = p[1];
    });
    return { command, props };
};

/**
 * Fill the base (foundation layer) with specified block
 */
templater.fillBase = function (template, position, direction) {
    let { base, width, depth } = template;
    let { x: x0, y: y0, z: z0 } = position;
    var margin = parseInt(base.margin || "0");
    switch (direction) {
        case "north":
            var x1 = x0 - Math.floor(width / 2) - margin;
            var x2 = x0 + Math.floor(width / 2) + margin - 1;
            var z1 = z0 - margin + 1;
            var z2 = z0 + depth + margin;
            system.fill(base.block, x1, y0 - 1, z1, x2, y0 - 1, z2);
            break;
        case "south":
            var x1 = x0 - Math.floor(width / 2) - margin;
            var x2 = x0 + Math.floor(width / 2) + margin;
            var z1 = z0 + margin - 1;
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
};

/**
 * Determine if this block needs to be attached to an adjacent block
 */
templater.isAttachmentBlock = function (token) {
    var blocks = ["torch", "lantern", "vine", "bell"];
    for (var block of blocks)
        if (token.indexOf(block) !== -1)
            return true;
    return false;
};

/**
 * Determines direction of a placed sign
 */
templater.directionOfSign = function (sign) {
    var groundSignDirection = sign.data.ground_sign_direction;
    var facingDirection = sign.data.facing_direction;

    if (typeof groundSignDirection === "number") {
        if (groundSignDirection < 4)
            return "south";
        else if (groundSignDirection < 8)
            return "west";
        else if (groundSignDirection < 12)
            return "north";
        else if (groundSignDirection < 16)
            return "east";
        return "north";
    } else if (typeof facingDirection === "number") {
        switch (facingDirection) {
            case 2:
                return "north";
            case 3:
                return "south";
            case 5:
                return "east";
            case 4:
                return "west";
        }
    }

    return "north";
};

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

// ==== Rotation Helpers ==============================

templater.rotateDirection = function (referenceDir, direction) {
    const rotation = {
        "north": { "west": "west", "east": "east", "north": "north", "south": "south" },
        "south": { "west": "east", "east": "west", "north": "south", "south": "north" },
        "east": { "west": "south", "east": "north", "north": "west", "south": "east" },
        "west": { "west": "north", "east": "south", "north": "east", "south": "west" }
    };
    return rotation[referenceDir][direction];
};

templater.rotateStairs = function (tileData, direction) {
    const rotation = {
        "0": { "west": "2", "east": "3", "north": "0", "south": "1" },
        "1": { "west": "3", "east": "2", "north": "1", "south": "0" },
        "2": { "west": "0", "east": "1", "north": "2", "south": "3" },
        "3": { "west": "1", "east": "0", "north": "3", "south": "2" }
    };
    return rotation[tileData][direction] || "2";
};

templater.rotateBed = function (tileData, direction) {
    const rotation = {
        "0": { "west": "1", "east": "3", "south": "2", "north": "0" },
        "1": { "west": "2", "east": "0", "south": "3", "north": "1" },
        "2": { "west": "3", "east": "1", "south": "0", "north": "2" },
        "3": { "west": "0", "east": "2", "south": "1", "north": "3" }
    };
    return rotation[tileData][direction] || "2";
};

templater.rotateChest = function (tileData, direction) {
    const rotation = {
        "2": { "west": "4", "east": "5", "south": "3", "north": "2" },
        "3": { "west": "5", "east": "4", "south": "2", "north": "3" },
        "4": { "west": "2", "east": "3", "south": "5", "north": "4" },
        "5": { "west": "3", "east": "2", "south": "4", "north": "5" }
    };
    return rotation[tileData][direction] || "2";
};

templater.rotateTorch = function (tileData, direction) {
    const rotation = {
        "1": { "west": "4", "east": "4", "south": "2", "north": "1" },
        "2": { "west": "3", "east": "3", "south": "1", "north": "2" },
        "3": { "west": "1", "east": "2", "south": "4", "north": "3" },
        "4": { "west": "2", "east": "1", "south": "3", "north": "4" }
    };
    return rotation[tileData][direction] || "2";
};

templater.rotateFence = function (tileData, direction) {
    const rotation = {
        "0": { "west": "1", "east": "1", "south": "0", "north": "0" },
        "1": { "west": "0", "east": "0", "south": "1", "north": "1" }
    };
    return rotation[tileData][direction] || "0";
};

templater.rotateVine = function (tileData, direction) {
    const rotation = {
        "1": { "west": "3", "east": "2", "south": "4", "north": "1" },
        "2": { "west": "4", "east": "1", "south": "3", "north": "2" },
        "3": { "west": "1", "east": "4", "south": "2", "north": "3" },
        "4": { "west": "2", "east": "3", "south": "1", "north": "4" }
    };
    return rotation[tileData][direction] || "2";
};

