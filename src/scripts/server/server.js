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
var tickCount = 0;
var playerTemplates = {}; // Each player can specify a template to use
var block_placed_position = { x: 0, y: 63, z: 0 };

system.initialize = function () {
    // Listen for new players joining
    system.listenForEvent("EnchantedSign:Player", (eventData) => this.onPlayer(eventData));
    // Listen for players placing blocks so we can capture the block position of the sign
    system.listenForEvent("minecraft:player_placed_block", (eventData) => this.onBlockPlaced(eventData));
    // Listen for players using items so we can detect when they place a a sign
    system.listenForEvent("minecraft:entity_use_item", (eventData) => this.onEntityUsed(eventData));
};

/**
 * Callback when a new player joins, register the player
 */
system.onPlayer = function (ed) {
    var name = this.getEntityName(ed.data.player);
    playerTemplates[name] = "house";
    //system.logf("Welcome to {0}", name);
};

/**
 * Called on each tick by the game - periodically check for player tags and update player templates
 */
system.update = function () {
    tickCount++;

    // Sync tag from players to determine the template to use
    if (tickCount % 20 === 0) {
        for(var name in playerTemplates) {       
            if(!playerTemplates.hasOwnProperty(name))
                continue;
            system.updateTemplate(name);
        };
    }
};

/**
 * Query the tags for the given player and update player template
 */
system.updateTemplate = function(playerName) {
    system.executeCommand(system.format("tag {0} list", playerName), function (ed) {
        var playerTemplate = playerTemplates[playerName] || "air";
        var msg = ed.data.statusMessage.replace("§a", "").replace("§r", "");
        var offset = msg.indexOf("tags: "); // Check for tags
        if (offset !== -1) {
            playerTemplate = msg.substring(offset + 6).trim();
            if (playerTemplates[playerName] !== playerTemplate) {
                system.logf("Template for player {0} updated to {1}", playerName, playerTemplate);
                playerTemplates[playerName] = playerTemplate;
            }
            // Clear the tag once we have grabbed it
            var cmd = system.format("tag {0} remove {1}", playerName, playerTemplate);
            //system.log(cmd);
            system.executeCommand(cmd, function (ed) {
                //system.log(ed);
            });
        }
    });
};

/**
 * Callback when an entity is used - we use this to intercept sign placement
 */
system.onEntityUsed = function (ed) {
    if (ed.data.item_stack.item === "minecraft:oak_sign" && ed.data.use_method == "place") {
        var name = system.getEntityName(ed.data.entity);
        //system.logf("Player {0} place a sign", name);
        var world = system.getComponent(ed.data.entity, "minecraft:tick_world");
        var block = system.getBlock(world.data.ticking_area, block_placed_position);
        var state = system.getComponent(block, "minecraft:blockstate");
        var direction = templater.directionTextOf(state.data.ground_sign_direction);
        system.build(block_placed_position, direction, playerTemplates[name] || "house");
    }
};

/**
 * Callback when a block is placed - we use this to track the sign position 
 */
system.onBlockPlaced = function (ed) {
    block_placed_position = ed.data.block_position;
};

/**
 * Main build function
 */
system.build = function (position, direction, type) {
    for (var name in templates) {        
        if (type === "template:" + name || type === name) {
            templater.fill(name, position, direction);
            break;        
        }
    }
};

// =============== HELPERS =======================================

system.logf = function (...message) {
    system.emit("minecraft:display_chat_event", { message: system.format(...message) });
};

system.emit = function (type, data) {
    let ed = system.createEventData(type);
    ed.data = data;
    system.broadcastEvent(type, ed);
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

system.summon = function (type, x, y, z) {
    system.executeCommand(system.format("summon {0} {1} {2} {3}", type, x, y, z), system.noop);
};

system.create = function (type, x, y, z) {
    system.executeCommand(system.format("fill {0} {1} {2} {3} {4} {5} {6}", x, y, z, x, y, z, type), system.noop);
};

system.fill = function (type, x1, y1, z1, x2, y2, z2) {
    system.executeCommand(system.format("fill {0} {1} {2} {3} {4} {5} {6}", x1, y1, z1, x2, y2, z2, type), system.noop);
};

system.fill2 = function (type, x1, y1, z1, x2, y2, z2, tileData) {
    system.executeCommand(system.format("fill {0} {1} {2} {3} {4} {5} {6} {7}", x1, y1, z1, x2, y2, z2, type, tileData), system.noop);
};

if(exports)
    exports.system = system;