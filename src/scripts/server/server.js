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

let system = server.registerSystem(0, 0);

// State variables used to track players and placed signs
system.tick = 0;
system.blockCache = {};
system.surfaceCache = {};
var playerTemplates = {}; // Each player can specify a template to use
var block_placed_position = { x: 0, y: 63, z: 0 };
var block_placed_player = null;
var block_placed_world = null;

system.initialize = function () {
    // Setup verbose logging
    system.setupLogging();
    // Listen for players placing blocks so we can capture the block position of the sign
    system.listenForEvent("minecraft:player_placed_block", (eventData) => this.onBlockPlaced(eventData));
    // Listen for players using items so we can detect when they place a a sign
    system.listenForEvent("minecraft:entity_use_item", (eventData) => this.onEntityUsed(eventData));
    // Listen for new players joining
    system.listenForEvent("EnchantedSign:Player", (eventData) => this.onPlayer(eventData));
};

/**
 * Callback when a new player joins, register the player
 */
system.onPlayer = function (ed) {
    var name = this.getEntityName(ed.data.player);
    playerTemplates[name] = "road"; // Give the player a default template
};

/**
 * Called on each tick by the game - periodically check for player tags and update player templates
 */
system.update = function () {
    system.dequeue();
    system.tick++;
    system.blockCache = {};
    system.surfaceCache = {};

    // Sync tag from players to determine the template to use
    if (system.tick % 10 === 0) {
        for (var name in playerTemplates) {
            if (!playerTemplates.hasOwnProperty(name))
                continue;
            system.updateTemplate(name);
        };
    }
};

/**
 * Callback when an entity is used - we use this to intercept sign placement
 */
system.onEntityUsed = function (ed) {
    if (ed.data.item_stack.item === "minecraft:oak_sign" && ed.data.use_method == "place") {
        var name = system.getEntityName(ed.data.entity);
        var world = system.getComponent(ed.data.entity, "minecraft:tick_world");
        var block = system.getBlock(world.data.ticking_area, block_placed_position);
        var state = system.getComponent(block, "minecraft:blockstate");
        var direction = templater.directionOfSign(state);
        system.build(playerTemplates[name] || "help", block_placed_position, direction);
    }
};

/**
 * Callback when a block is placed - we use this to track the sign position 
 */
system.onBlockPlaced = function (ed) {
    block_placed_position = ed.data.block_position;
    block_placed_player = ed.data.player;
    block_placed_world = system.getComponent(block_placed_player, "minecraft:tick_world");
};

/**
 * Query the tags for the given player and update player template
 */
system.updateTemplate = function (playerName) {
    system.exec(system.format("tag {0} list", playerName), function (ed) {
        var playerTemplate = playerTemplates[playerName] || "air";
        // Remove the markup characters from the text
        var msg = ed.data.statusMessage.replace("§a", "").replace("§r", "");
        // We have to parse the tags from status message
        var offset = msg.indexOf("tags: "); // Check for tags
        if (offset !== -1) {
            playerTemplate = msg.substring(offset + 6).trim();
            if (playerTemplates[playerName] !== playerTemplate) {
                system.logf("Template for player {0} updated to {1}", playerName, playerTemplate);
                playerTemplates[playerName] = playerTemplate;
            }
            // Clear the tag once we have grabbed it
            var cmd = system.format("tag {0} remove {1}", playerName, playerTemplate);
            system.exec(cmd, system.noop);
        }
    });
};

/**
 * Main build function
 */
system.build = function (templateName, position, direction) {

    // Remove the sign
    system.create2("air", position);

    // Find the template from the tag
    if (templateName.startsWith("template:")) {
        templateName = templateName.substring(9);
        templater.fill(templateName, position, direction);
    } else if (templateName.startsWith("macro:")) {
        macroName = templateName.substring(6);
        templater.macro(macroName, position, direction);
    } else {
        templater.fill(templateName, position, direction); // Fallback to assume name is just the template
    }
};

// =============== HELPERS ===============================================================

system.setupLogging = function () {
    system.emitNow("minecraft:script_logger_config", { log_errors: true, log_information: true, log_warnings: true });
};

system.logf = function (...message) {
    system.emitNow("minecraft:display_chat_event", { message: system.format(...message) });
};

system.emit = function (type, data) {
    if (system.deferredMode)
        system.enqueue(type, data);
    else
        system.emitNow(type, data);
};

system.emitNow = function (type, data) {
    let ed = system.createEventData(type);
    ed.data = data;
    system.broadcastEvent(type, ed);
};

// Used to store deferred events for next tick
system.deferredEvents = [];

/**
 * Queue an event to be emitted on the next tick
 */
system.enqueue = function (type, data) {
    system.deferredEvents.push({ type, data });
};

/**
 * Process the deferred events
 */
system.dequeue = function () {
    system.deferredMode = false;
    for (var event of system.deferredEvents) {
        if (event.command) // Check if this is a command or an event
            system.executeCommand(event.command, event.callback);
        else
            system.emit(event.type, event.data);
    }
    system.deferredEvents = [];
};

system.getEntityName = function (entity) {
    var nameable = this.getComponent(entity, "minecraft:nameable");
    return nameable.data.name;
}

system.logComponent = function (block, name) {
    system.log(name, this.getComponent(block, name));
};

system.format = function (format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match
            ;
    });
};

system.noop = function () {
};

/**
 * Wrap system.executeCommand so we can defer for next tick
 */
system.exec = function (command, callback) {
    if (system.deferredMode)
        system.deferredEvents.push({ command, callback });
    else
        system.executeCommand(command, callback);
};

system.summon = function (type, x, y, z) {
    system.exec(system.format("summon {0} {1} {2} {3}", type, x, y, z), system.noop);
};

system.create = function (type, x, y, z) {
    system.exec(system.format("fill {0} {1} {2} {3} {4} {5} {6}", x, y, z, x, y, z, type), system.noop);
};

system.create2 = function (type, pos) {
    let { x, y, z } = pos;
    system.exec(system.format("fill {0} {1} {2} {3} {4} {5} {6}", x, y, z, x, y, z, type), system.noop);
};

system.fill = function (type, x1, y1, z1, x2, y2, z2) {
    system.exec(system.format("fill {0} {1} {2} {3} {4} {5} {6}", x1, y1, z1, x2, y2, z2, type), system.noop);
};

system.fill2 = function (type, x1, y1, z1, x2, y2, z2, tileData) {
    system.exec(system.format("fill {0} {1} {2} {3} {4} {5} {6} {7}", x1, y1, z1, x2, y2, z2, type, tileData), system.noop);
};

system.findTheSurface = function (position) {

    var { x, y, z } = position;

    // Check for block type
    var blockType = system.getBlockType2(x, y, z);

    if (blockType == "air") {
        // Find lowest air block
        while (blockType === "air" && y > 0) {
            y -= 1;
            blockType = system.getBlockType2(x, y, z);
        }
        y += 1;

    } else {
        // Find highest non-air block
        while (blockType !== "air" && y < 254) {
            y += 1;
            blockType = system.getBlockType2(x, y, z);
        }
    }

    return y;
};

system.findTheSurface2 = function (x, y, z) {
    var sfkey = system.format("{0}:{1}", x, z);
    var surface = system.surfaceCache[sfkey];
    if (typeof surface !== "number") {
        surface = system.findTheSurface({ x, y, z });
        system.surfaceCache[sfkey] = surface;
    }

    return surface;
};

system.getBlockType2 = function (x, y, z) {
    var key = system.format("{0},{1},{2}", x, y, z);
    var type = system.blockCache[key];
    if (typeof type !== "string") {
        type = system.getBlockType(block_placed_world, { x, y, z });
        system.blockCache[type] = type;
    }
    return type;
};

system.getBlockType = function (world, position) {
    if (!world)
        return "air";
    var block = system.getBlock(world.data.ticking_area, position);
    return system.getBlockType3(block);
};

system.getBlockType3 = function (block) {
    if (!block)
        return "air";
    var id = block.__identifier__;
    if (id && id.startsWith("minecraft:"))
        id = id.substring(10);
    return id;
}

// ============== EXPORTS FOR TESTING ===============================================================

if (typeof exports === "object") {
    exports.system = system;
    exports.templates = templates;
    exports.macros = macros;
    exports.templater = templater;
}