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
var playerTemplates = {};
var block_placed_position = { x: 0, y: 63, z: 0 };

system.initialize = function () {
    this.listenForEvent("minecraft:entity_use_item", (eventData) => this.onEntityUsed(eventData));
    this.listenForEvent("minecraft:player_placed_block", (eventData) => this.onBlockPlaced(eventData));
    this.listenForEvent("EnchantedSign:Player", (eventData) => this.onPlayer(eventData));
};

system.onPlayer = function (ed) {
    var name = this.getEntityName(ed.data.player);
    playerTemplates[name] = "house";
    this.logf("Welcome to {0}", name);
};

system.getEntityName = function (entity) {
    var nameable = this.getComponent(entity, "minecraft:nameable");
    return nameable.data.name;
}

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

system.updateTemplate = function(name) {
    system.executeCommand(system.format("tag {0} list", name), function (ed) {
        var playerTemplate = playerTemplates[name] || "air";
        var msg = ed.data.statusMessage.replace("§a", "").replace("§r", "");
        var offset = msg.indexOf("tags: "); // Check for tags
        if (offset !== -1) {
            playerTemplate = msg.substring(offset + 6).trim();
            if (playerTemplates[name] !== playerTemplate) {
                system.logf("Template for player {0} updated to {1}", name, playerTemplate);
                playerTemplates[name] = playerTemplate;
            }
            // Clear the tag once we have grabbed it
            var cmd = system.format("tag {0} remove {1}", name, playerTemplate);
            //system.log(cmd);
            system.executeCommand(cmd, function (ed) {
                //system.log(ed);
            });
        }
    });
};

system.logf = function (...message) {
    this.emit("minecraft:display_chat_event", { message: this.format(...message) });
};

system.emit = function (type, data) {
    let ed = this.createEventData(type);
    ed.data = data;
    this.broadcastEvent(type, ed);
};

system.onEntityUsed = function (ed) {
    if (ed.data.item_stack.item === "minecraft:oak_sign" && ed.data.use_method == "place") {
        var name = this.getEntityName(ed.data.entity);
        system.logf("Player {0} place a sign", name);
        var world = this.getComponent(ed.data.entity, "minecraft:tick_world");
        var block = this.getBlock(world.data.ticking_area, block_placed_position);
        var state = this.getComponent(block, "minecraft:blockstate");
        this.build(block_placed_position, state.data.ground_sign_direction, playerTemplates[name] || "house");
    }
};

system.onBlockPlaced = function (ed) {
    block_placed_position = ed.data.block_position;
};

system.logComponent = function (block, name) {
    this.log(name, this.getComponent(block, name));
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

// Main build function
system.build = function (position, direction, type) {
    for (var name in templates) {
        if (type.indexOf("template:" + name) !== -1 || type.indexOf(name) !== -1) {
            system.fillTemplate(name, position, this.directionTextOf(direction));
            break;
        }
    }
};

system.directionTextOf = function (dir) {
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

system.noop = function (ed) {
    //system.log(ed);
};

system.summon = function (type, x, y, z) {
    this.executeCommand(this.format("summon {0} {1} {2} {3}", type, x, y, z), system.noop);
};

system.create = function (type, x, y, z) {
    this.executeCommand(this.format("fill {0} {1} {2} {3} {4} {5} {6}", x, y, z, x, y, z, type), system.noop);
};

system.fill = function (type, x1, y1, z1, x2, y2, z2) {
    this.executeCommand(this.format("fill {0} {1} {2} {3} {4} {5} {6}", x1, y1, z1, x2, y2, z2, type), system.noop);
};

system.fill2 = function (type, x1, y1, z1, x2, y2, z2, tileData) {
    this.executeCommand(this.format("fill {0} {1} {2} {3} {4} {5} {6} {7}", x1, y1, z1, x2, y2, z2, type, tileData), system.noop);
};

const house = `
_ = air
b = bed
c = cobblestone
d = wooden_door
g = glass_pane
h = chest
l = wooden_slab
o = torch
p = planks
s = stone_stairs 2
t = crafting_table
w = log
v = vine
2 = carpet 5
3 = oak_stairs 2
4 = oak_stairs 1
5 = carpet
f = fence

    w c c c c c w   w c c c c c w   w c g g g c w   w c c c c c w   w p p p p p w   _ l p p p l _   _ _ _ l _ _ _ 
    c p p p p p c   c t _ h h _ c   c _ _ _ _ _ c   c _ _ _ _ _ c   p p p p p p p   _ l p p p l _   _ _ _ l _ _ _ 
    c p p p p p c   c _ b 2 2 3 c   c _ _ _ _ _ c   c _ _ _ _ _ c   p p p p p p p   _ l p p p l _   _ _ _ l _ _ _ 
    c p p p p p c   c _ 2 2 2 f c   g _ _ _ _ 5 c   c _ _ _ _ _ c   p p p p p p p   _ l p p p l _   _ _ _ l _ _ _ 
    c p p p p p c   c _ _ _ _ 4 c   c _ _ _ _ _ c   c _ _ _ _ _ c   p p p p p p p   _ l p p p l _   _ _ _ l _ _ _ 
    w c c c c c w   w c c d c c w   w g c d c g w   w c c c c c w   w p p g p p w   _ l p p p l _   _ _ _ l _ _ _ 
    v v s s s _ _   v v _ _ _ _ _   v _ o _ o _ _   v v v _ _ _ _   _ v v _ _ _ _   _ _ v _ _ _ _   _ _ _ _ _ _ _
`;

const dungeon = `
c = mossy_cobblestone
m = mob_spawner
w = water
_ = air

    c c c c c c c c c   c c c c c c c c c   c c c c c c c c c   c c c c c c c c c   c c c c c c c c c   c c c c c c c c c   c c c c c c c c c   c c c c c c c c c   
    c c c c c c c c c   c w w w w w w w c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c c c c c c c c c 
    c c c c c c c c c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c c c c c c c c c        
    c c c c c c c c c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c c c c c c c c c        
    c c c c c c c c c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ m _ _ _ c   c _ _ _ _ _ _ _ c   c c c c c c c c c        
    c c c c c c c c c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c c c c c c c c c       
    c c c c c c c c c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c c c c c c c c c     
    c c c c c c c c c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c _ _ _ _ _ _ _ c   c c c c c c c c c     
    c c c c c c c c c   c c c c _ c c c c   c c c c c c c c c   c c c c c c c c c   c c c c c c c c c   c c c c c c c c c   c c c c c c c c c   c c c c c c c c c
`;

const farm = `
l = log
d = farmland
w = water
c = carrots
p = composter
_ = air

   l l l l l l l l l l   _ _ _ _ _ _ _ _ _ _
   l d d w d d w d d l   _ c c _ c c _ c c _
   l d d w d d w d d l   _ c c _ c c _ c c _
   l d d w d d w d d l   _ c c _ c c _ c c _
   l d d w d d w d d l   _ c c _ c c _ c c _
   l d d w d d w d d l   _ c c _ c c _ c c _
   l d d w d d w d d l   _ c c _ c c _ c c _
   l d d w d d w d d l   _ c c _ c c _ c c _
   l d d w d d w d d l   _ c c _ c c _ c c _ 
   l d d w d d w d d l   _ c c _ c c _ c c _ 
   l d d w d d w d d l   _ c c _ c c _ c c _ 
   l d d w d d w d d l   _ c c _ c c _ c c _ 
   l d d w d d w d d l   _ c c _ c c _ c c _ 
   l d d w d d w d d l   _ c c _ c c _ c c _ 
   l d d w d d w d d l   _ c c _ c c _ c c _ 
   l d d w d d w d d l   _ c c _ c c _ c c _ 
   l d d w d d w d d l   _ c c _ c c _ c c _ 
   l d d w d d w d d l   _ c c _ c c _ c c _ 
   l d d w d d w d d l   _ c c _ c c _ c c _
   l d d w d d w d d l   _ c c _ c c _ c c _ 
   l d d w d d w d d l   _ c c _ c c _ c c _ 
   l d d w d d w d d l   _ p c _ c c _ c c _
   l l l l l l l l l l   _ _ _ _ _ _ _ _ _ _ 
`;

const air = `
_ = air

   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _
   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _
   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _
   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _
   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _
   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _
   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _
   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _
   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _
`;

const chicken_farm = `
s = stone
g = glass
c = chest
h = hopper 2
b = stone_slab
r = redstone_wire
p = powered_repeater
d = dispenser
l = lava
f = fence
4 = $chicken x 4

_ = air

   s s s   s r s   s _ s   _ _ _   _ _ _
   s _ s   s s s   s p s   s g s   _ _ _
   s _ s   s d s   s h s   g 4 g   _ f _
   s h s   s b s   s l s   s g s   _ _ _
   s c s   s _ s   s g s   s s s   _ _ _
`;

const cow_farm = `
g = grass
f = fence
c = $cow
t = fence_gate
_ = air

   g g g g g g g   f f f f f f f 
   g g g g g g g   f c c c c c f
   g g g g g g g   f _ _ _ _ _ f
   g g g g g g g   f _ _ _ _ _ f
   g g g g g g g   f _ _ _ _ _ f
   g g g g g g g   f _ _ _ _ _ f
   g g g g g g g   f _ _ _ _ _ f
   g g g g g g g   f f f t f f f

!offset 0 -1 0
`;

const shelter = `
p = planks
f = fence
_ = air
s = wooden_slab
y = wool 4
o = wool 1
b = bell 4
l = lantern

   p p p p p   f _ _ _ f   f _ _ _ f   f _ _ _ f   s s s s s   _ _ _ _ _
   p p p p p   _ y o y _   _ _ _ _ _   _ _ _ _ _   s s s s s   _ _ _ _ _
   p p p p p   _ o y o _   _ _ _ _ _   _ _ b _ _   s s p s s   _ _ l _ _      
   p p p p p   _ y o y _   _ _ _ _ _   _ _ _ _ _   s s s s s   _ _ _ _ _   
   p p p p p   f _ _ _ f   f _ _ _ f   f _ _ _ f   s s s s s   _ _ _ _ _   
`;

const forest = `
g = grass
r = grass_path
s = sapling
w = water
f = red_flower
_ = air

   g g g g g g g g r g g g g g g g   _ s _ _ _ s _ _ _ _ _ s _ _ _ s   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g r g g g g g g g   _ _ _ _ _ _ _ f _ _ _ _ _ f _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g w w g g r g g g g g g g   _ f _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g w w g g r g g g g g g g   _ _ _ _ _ s _ _ _ _ _ s _ _ _ s   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g r g g g g g g g   _ _ _ s _ _ _ _ s _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g r g g g g g g g   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g r g g g g g g g   _ s _ _ _ s _ _ _ _ _ s _ _ _ s   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g r r g g g g g g   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g g r g g g g g g   _ _ _ _ _ _ _ f _ _ _ _ _ f _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g g r g g g g g g   _ s _ _ _ s _ _ _ _ _ s _ _ _ s   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g g r g g g g g g   _ _ _ s _ _ _ _ s _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g g r g g g g g g   _ _ _ _ _ _ _ _ _ _ _ _ _ f _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g r r g g g g g g   _ _ _ _ _ s _ _ _ _ s _ _ _ _ s   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g r g g g g g g g   _ _ s _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g r g g g g g g g   _ _ _ _ _ _ _ _ _ _ _ _ _ f _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
   g g g g g g g g r g g g g g g g   _ s _ _ _ s _ _ _ _ _ s _ _ _ s   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _

!offset 0 -1 0
`;

const road = `
g = grass
r = grass_path
f = red_flower
_ = air

   g r g   _ _ _ 
   g r g   _ _ _ 
   g r g   _ _ _ 
   g r g   _ _ f 
   g r g   _ _ _ 
   g r g   _ _ _ 
   g r g   _ _ _ 
   g r g   _ _ _ 
   g r g   _ _ _ 
   g r g   _ _ _ 
   g r g   _ _ _ 
   g r g   _ _ _ 
   g r g   _ _ _ 
   g r g   f _ _ 
   g r g   _ _ _ 
   g r g   _ _ _ 
   g r g   _ _ _ 
   g r g   _ _ _ 

!offset 0 -1 0  
`;

const sphere = `
p = planks
l = lantern 5
f = fence
g = glass
_ = air

   _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ p p p _ _ _ _   _ _ _ p p g p p _ _ _   _ _ _ _ p p p _ _ _ _   _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _
   _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _   _ _ _ p p p p p _ _ _   _ _ p p _ _ _ p p _ _   _ _ p _ _ _ _ _ p _ _   _ _ p p _ _ _ p p _ _   _ _ _ p p p p p _ _ _   _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _
   _ _ _ _ _ _ _ _ _ _ _   _ _ _ p p p p p _ _ _   _ _ p _ _ _ _ _ p _ _   _ p _ _ _ _ _ _ _ p _   _ p _ _ _ _ _ _ _ p _   _ p _ _ _ _ _ _ _ p _   _ _ p _ _ _ _ _ p _ _   _ _ _ p p p p p _ _ _   _ _ _ _ _ _ _ _ _ _ _
   _ _ _ _ p p p _ _ _ _   _ _ p p _ _ _ p p _ _   _ p _ _ _ _ _ _ _ p _   _ p _ _ _ _ _ _ _ p _   p _ _ _ _ _ _ _ _ _ p   _ p _ _ _ _ _ _ _ p _   _ p _ _ _ _ _ _ _ p _   _ _ p p _ _ _ p p _ _   _ _ _ _ p p p _ _ _ _
   _ _ _ p p p p p _ _ _   _ _ p _ _ _ _ _ p _ _   _ p _ _ _ _ _ _ _ p _   p _ _ _ _ _ _ _ _ _ p   p _ _ _ _ _ _ _ _ _ p   p _ _ _ _ _ _ _ _ _ p   _ p _ _ _ _ _ _ _ p _   _ _ p _ _ _ _ _ p _ _   _ _ _ p p g p p _ _ _
   _ _ _ p p p p p _ _ _   _ _ p _ _ _ _ _ p _ _   _ p _ _ _ _ _ _ _ p _   p _ _ _ _ _ _ _ _ _ p   g _ _ _ _ _ _ _ _ _ g   p _ _ _ _ _ _ _ _ _ p   _ p _ _ _ l _ _ _ p _   _ _ p _ _ f _ _ p _ _   _ _ _ p g p g p _ _ _
   _ _ _ p p p p p _ _ _   _ _ p _ _ _ _ _ p _ _   _ p _ _ _ _ _ _ _ p _   p _ _ _ _ _ _ _ _ _ p   p _ _ _ _ _ _ _ _ _ p   p _ _ _ _ _ _ _ _ _ p   _ p _ _ _ _ _ _ _ p _   _ _ p _ _ _ _ _ p _ _   _ _ _ p p g p p _ _ _
   _ _ _ _ p p p _ _ _ _   _ _ p p _ _ _ p p _ _   _ p _ _ _ _ _ _ _ p _   _ p _ _ _ _ _ _ _ p _   p _ _ _ _ _ _ _ _ _ p   _ p _ _ _ _ _ _ _ p _   _ p _ _ _ _ _ _ _ p _   _ _ p p _ _ _ p p _ _   _ _ _ _ p p p _ _ _ _
   _ _ _ _ p _ p _ _ _ _   _ _ _ p p p p p _ _ _   _ _ p _ _ _ _ _ p _ _   _ p _ _ _ _ _ _ _ p _   _ p _ _ _ _ _ _ _ p _   _ p _ _ _ _ _ _ _ p _   _ _ p _ _ _ _ _ p _ _   _ _ _ p p p p p _ _ _   _ _ _ _ _ _ _ _ _ _ _
   _ _ _ _ p p p _ _ _ _   _ _ _ _ p p p _ _ _ _   _ _ _ p p _ p p _ _ _   _ _ p p _ _ _ p p _ _   _ _ p _ _ _ _ _ p _ _   _ _ p p _ _ _ p p _ _   _ _ _ p p p p p _ _ _   _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _
   _ _ _ _ p p p _ _ _ _   _ _ _ _ p _ p _ _ _ _   _ _ _ _ p _ p _ _ _ _   _ _ _ _ p _ p _ _ _ _   _ _ _ p p p p p _ _ _   _ _ _ _ p p p _ _ _ _   _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _   _ _ _ _ _ _ _ _ _ _ _   

`;

const haystack = `
h = hay_block
g = grass
_ = air

   g g g g g g   _ _ _ _ _ _   _ _ _ _ _ _ 
   g g g g g g   _ h h h h _   _ h h h h _ 
   g g g g g g   _ h h h h _   _ _ h h h _ 
   g g g g g g   _ h h h h _   _ _ h h h _ 
   g g g g g g   _ _ _ _ _ _   _ _ _ _ _ _ 

!offset 0 -1 -0
`;

const hayshed = `
h = hay_block
g = grass
_ = air
f = fence
s = wooden_slab

g g g g g g   f _ _ _ _ f   f _ _ _ _ f   f _ _ _ _ f   s s s s s s 
g g g g g g   _ h h h h _   _ h h h h _   _ _ _ _ _ _   s s s s s s 
g g g g g g   _ h h h h _   _ _ h h h _   _ _ _ _ _ _   s s s s s s 
g g g g g g   _ h h h h _   _ _ h h h _   _ _ _ _ _ _   s s s s s s 
g g g g g g   f _ _ _ _ f   f _ _ _ _ f   f _ _ _ _ f   s s s s s s 

!offset 0 -1 -0
`;

const stairs = `
1 = oak_stairs 1
2 = oak_stairs 2
3 = oak_stairs 3
4 = oak_stairs 4
5 = oak_stairs 5
6 = oak_stairs 6
7 = oak_stairs 7
8 = oak_stairs 8
9 = oak_stairs 9
0 = oak_stairs 10
e = oak_stairs 11
t = oak_stairs 12

   1 2 3 4 5 6 7 8 9 0 e t

`;

const templates = {
    "stairs": stairs,
    "house": house,
    "dungeon": dungeon,
    "chicken_farm": chicken_farm,
    "cow_farm": cow_farm,
    "farm": farm,
    "air": air,
    "shelter": shelter,
    "road": road,
    "forest": forest,
    "sphere": sphere,
    "haystack": haystack,
    "hayshed": hayshed,
}

system.fillTemplate = function (templateName, position, direction) {

    this.logf("Generating template '{0}' at {1} with direction {2}", templateName, JSON.stringify(position), direction);

    var template = templates[templateName];
    if (typeof (template) == "undefined")
        template = templates["house"];

    // Remove the sign
    this.create("air", position.x, position.y, position.z);

    // Split the template into tokens and layers
    var tokens = {};
    var layers = [];
    var lines = template.split("\n");
    var offset = { x: 0, y: 0, z: 0 };
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
        } else if (line.startsWith("!offset ")) {
            var offsets = line.substring(8).trim().split(" ").map(s => parseInt(s));
            offset.x = offsets[0];
            offset.y = offsets[1];
            offset.z = offsets[2];
        }
    }

    // Calculate position and size
    let updatedPosition = this.applyOffset(position, direction, offset);
    let { x: x0, y: y0, z: z0 } = updatedPosition;
    let depth = layers.length;
    let height = layers[0].length;
    let width = layers[0][0].length;

    // Loop through layers and fill in tokens
    for (i = 0; i < depth; i++) {
        for (j = 0; j < height; j++) {
            for (k = 0; k < width; k++) {
                var key = layers[i][j][k];
                var token = tokens[key];
                if (typeof (token) === "undefined") {
                    console.log("Missing key:" + key);
                    token = "magenta_glazed_terracotta"; // missing a key, make it stand out
                }
                
                // Check for fill or summon
                var createFn = this.create.bind(this);
                if(token.startsWith("$")) {
                    createFn = this.summon.bind(this);
                    token = token.substring(1);
                    
                    // Check for multiplier
                    var parts = token.split(" ");
                    if(parts.length > 1 && parts[1] === "x") { // $chicken x 4
                        var times = parseInt(parts[2]);
                        createFn = function(...args) {
                            for(var i = 0; i < times; i++)
                                system.summon(...args);
                        };
                        token = parts[0];
                    }
                } 
                
                // Check if we need to rotate the block
                if(token.indexOf(" ") !== -1 ) {
                    var parts = token.split(" ");
                    token = parts[0];
                    var tileData = parts[1];
                    if(token.indexOf("stairs") !== -1)
                        token = system.format("{0} {1}", token, system.rotateStairs(tileData, direction));
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

system.applyOffset = function (position, direction, offset) {
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

system.rotateStairs = function (tileData, direction) {
    return tileData;
    //const rotation = {"north": 0, "east": 4, "south": 8, "west": 12};
    //return (parseInt(tileData) + (rotation[direction] || 0 )) % 16;
};

system.testHouse = function () {
    this.build({ x: 0, y: 0, z: 0 }, 11, "template:stairs");
};

// support for testing
if (typeof (exports) === "undefined")
    exports = {};
exports.system = system;