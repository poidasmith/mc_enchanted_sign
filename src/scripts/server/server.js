var system = server.registerSystem(0,0);

var spatialQuery;
var tickCount = 0;
var playerTag = "house";
function noop(ed) {
    system.log(ed);
};

system.initialize = function() {
    var scriptLoggerConfig = this.createEventData("minecraft:script_logger_config");
    scriptLoggerConfig.data.log_errors = true;
    scriptLoggerConfig.data.log_information = true;
    scriptLoggerConfig.data.log_warnings = true;

    this.broadcastEvent("minecraft:script_logger_config", scriptLoggerConfig);
    this.listenForEvent("minecraft:block_interacted_with", (eventData) => this.onBlockInteracted(eventData));
    this.listenForEvent("minecraft:entity_created", (eventData) => this.onEntityCreated(eventData));
    this.listenForEvent("minecraft:entity_use_item", (eventData) => this.onEntityUsed(eventData));
    this.listenForEvent("minecraft:entity_definition_event", (eventData) => this.onEntityDefinition(eventData));
    this.listenForEvent("minecraft:player_placed_block", (eventData) => this.onBlockPlaced(eventData));
    
    this.listenForEvent("EnchantedSign:Player", (eventData) => this.onPlayer(eventData));

    spatialQuery = this.registerQuery("minecraft:position", "x", "y", "z");    
};

system.onLoadUI = function(ed) {
  this.log("load UI", ed)  ;
};

system.onEvent = function(ed) {
    this.log("event", ed)  ;
  };
  
system.update = function() {
    tickCount++;

    if(tickCount % 20 === 0) {
        this.executeCommand("tag @p list", function(ed) {
            playerTag = "air";
            var msg = ed.data.statusMessage;
            var offset = msg.indexOf("tags: ");
            if(offset !== -1) {
                playerTag = msg.substring(offset + 6);
            }
        });
    }
};

system.log = function(...items) {
	const toString = item => {
		switch(Object.prototype.toString.call(item)) {
			case '[object Undefined]':
				return 'undefined';
			case '[object Null]':
				return 'null';
			case '[object String]':
				return `"${item}"`;
			case '[object Array]':
				const array = item.map(toString);
				return `[${array.join(', ')}]`;
			case '[object Object]':
				const object = Object.keys(item).map(key => `${key}: ${toString(item[key])}`);
				return `{${object.join(', ')}}`;
			case '[object Function]':
				return item.toString();
			default:
				return item;
		}
	}

	this.emit('minecraft:display_chat_event', {message: items.map(toString).join(' ')});
};

system.emit = function(type, data) {
    let ed = this.createEventData(type);
    ed.data = data;
    this.broadcastEvent(type, ed);
};

system.onPlayer = function(player) {
    this.log("Player joined!", player);
};

var captured_sign = false;
var extracted_sign = false;
var block_placed_position;
var player;

system.onEntityUsed = function(ed) {
    if(ed.data.item_stack.item === "minecraft:oak_sign" && ed.data.use_method == "place") {
        var world = this.getComponent(ed.data.entity, "minecraft:tick_world");
        var block = this.getBlock(world.data.ticking_area, block_placed_position);
        var state = this.getComponent(block, "minecraft:blockstate");
        this.build(block_placed_position, state.data.ground_sign_direction, playerTag);        
    }
};

system.onCommandData = function(ed) {
    this.log("command result", ed);
}

system.onEntityDefinition = function(ed) {
    //this.log("Entity definition", ed);
};

system.onBlockInteracted = function(ed) {
    this.log("Block interacted with", ed);
};

system.onEntityCreated = function(ed) {
    if(ed.data.entity.__identifier__ === "minecraft:oak_sign") {
        //this.log("Sign created", ed);
    }
};

system.onBlockPlaced = function(ed) {
    //this.log("Block Placed", ed.data.block_position, " by ", ed.data.player);
    block_placed_position = ed.data.block_position;
    player = ed.data.player;
    captured_sign = true;
};

system.logComponent = function(block, name) {
    this.log(name, this.getComponent(block, name));
};

system.build = function(position, direction, type) {
    if(type.indexOf("house") !== -1) {
        this.log("building house at", position, direction);

        system.house(position, direction);
    } else if(type.indexOf("eraser")) {
        this.log("clearing at", position, direction);
        system.clear(position, direction);
    }
};

if (!String.format) {
    String.format = function(format) {
      var args = Array.prototype.slice.call(arguments, 1);
      return format.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined'
          ? args[number] 
          : match
        ;
      });
    };
  }

system.create = function(type, x, y, z) {
    this.executeCommand(String.format("fill {0} {1} {2} {3} {4} {5} {6}", x, y, z, x, y, z, type), noop);
};

system.fill = function(type, x1, y1, z1, x2, y2, z2) {
    this.executeCommand(String.format("fill {0} {1} {2} {3} {4} {5} {6}", x1, y1, z1, x2, y2, z2, type), noop);
};

system.fill2 = function(type, x1, y1, z1, x2, y2, z2, tileData) {
    this.executeCommand(String.format("fill {0} {1} {2} {3} {4} {5} {6} {7}", x1, y1, z1, x2, y2, z2, type, tileData), noop);
};

system.clear = function(position, direction) {
    let {x, y, z} = position;

    if(direction == 8) {
        this.fill("air", x-6, y, z+1, x+6, y+100, z+15);
    }

};

system.house = function(position, direction) {
    let {x, y, z} = position;

    if(direction == 8) {

        // clear the space first
        this.fill("air", x-6, y, z+1, x+6, y+6, z+11);

        // floor
        this.fill("cobblestone", x-4, y, z+1, x+4, y, z+11);

        // ceiling
        this.fill("planks", x-4, y+5, z+1, x+4, y+5, z+11);

        // upright beams
        this.fill("log", x-4, y, z+1, x-4, y+5, z+1);
        this.fill("log", x+4, y, z+1, x+4, y+5, z+1);
        this.fill("log", x-4, y, z+11, x-4, y+5, z+11);
        this.fill("log", x+4, y, z+11, x+4, y+5, z+11);

        // walls
        this.fill("cobblestone", x-3, y+1, z+1, x+3, y+4, z+1);
        this.fill("cobblestone", x-3, y+1, z+11, x+3, y+4, z+11);
        this.fill("cobblestone", x+4, y+1, z+2, x+4, y+4, z+10);
        this.fill("cobblestone", x-4, y+1, z+2, x-4, y+4, z+10);

        // doors and windows
        this.fill("wooden_door", x, y+1, z+1, x, y+2, z+1);
        this.fill2("stone_stairs", x-1, y, z, x+1, y, z, 2);
        this.fill("glass_pane", x-2, y+2, z+1, x-2, y+3, z+1);
        this.fill("glass_pane", x+2, y+2, z+1, x+2, y+3, z+1);

        this.fill("glass_pane", x+4, y+2, z+3, x+4, y+3, z+3);
        this.fill("glass_pane", x+4, y+2, z+5, x+4, y+3, z+5);
        this.fill("glass_pane", x+4, y+2, z+7, x+4, y+3, z+7);
        this.fill("glass_pane", x+4, y+2, z+9, x+4, y+3, z+9);

        this.fill("glass_pane", x-4, y+2, z+3, x-4, y+3, z+3);
        this.fill("glass_pane", x-4, y+2, z+5, x-4, y+3, z+5);
        this.fill("glass_pane", x-4, y+2, z+7, x-4, y+3, z+7);
        this.fill("glass_pane", x-4, y+2, z+9, x-4, y+3, z+9);

        this.fill("glass_pane", x-3, y+2, z+11, x+3, y+3, z+11);

        // roof

        this.fill2("oak_stairs", x-5, y+5, z, x+5, y+5, z, 2);
        this.fill2("oak_stairs", x-5, y+5, z+12, x+5, y+5, z+12, 3);
        this.fill2("oak_stairs", x+5, y+5, z, x+5, y+5, z+12, 1);
        this.fill2("oak_stairs", x-5, y+5, z, x-5, y+5, z+12, 8);

        this.fill2("oak_stairs", x-4, y+6, z+1, x+4, y+6, z+1, 2);
        this.fill2("oak_stairs", x-4, y+6, z+11, x+4, y+6, z+11, 3);
        this.fill2("oak_stairs", x+4, y+6, z+1, x+4, y+6, z+11, 1);
        this.fill2("oak_stairs", x-4, y+6, z+1, x-4, y+6, z+11, 8);

    } else if(direction === 0) {

        // clear the space first
        this.fill("air", x-6, y, z-1, x+6, y+6, z-11);

        // floor
        this.fill("cobblestone", x-4, y, z-1, x+4, y, z-11);

        // ceiling
        this.fill("planks", x-4, y+5, z-1, x+4, y+5, z-11);

        // upright beams
        this.fill("log", x-4, y, z-1, x-4, y+5, z-1);
        this.fill("log", x+4, y, z-1, x+4, y+5, z-1);
        this.fill("log", x-4, y, z-11, x-4, y+5, z-11);
        this.fill("log", x+4, y, z-11, x+4, y+5, z-11);
        

        // walls
        this.fill("cobblestone", x-3, y+1, z-1, x+3, y+4, z-1);
        this.fill("cobblestone", x-3, y+1, z-11, x+3, y+4, z-11);
        this.fill("cobblestone", x+4, y+1, z-2, x+4, y+4, z-10);
        this.fill("cobblestone", x-4, y+1, z-2, x-4, y+4, z-10);


        // doors and windows
        this.fill("wooden_door", x, y+1, z-1, x, y+2, z-1);
        this.fill2("stone_stairs", x-1, y, z, x+1, y, z, 3);
        this.fill("glass_pane", x-2, y+2, z-1, x-2, y+3, z-1);
        this.fill("glass_pane", x+2, y+2, z-1, x+2, y+3, z-1);

        this.fill("glass_pane", x+4, y+2, z-3, x+4, y+3, z-3);
        this.fill("glass_pane", x+4, y+2, z-5, x+4, y+3, z-5);
        this.fill("glass_pane", x+4, y+2, z-7, x+4, y+3, z-7);
        this.fill("glass_pane", x+4, y+2, z-9, x+4, y+3, z-9);

        this.fill("glass_pane", x-4, y+2, z-3, x-4, y+3, z-3);
        this.fill("glass_pane", x-4, y+2, z-5, x-4, y+3, z-5);
        this.fill("glass_pane", x-4, y+2, z-7, x-4, y+3, z-7);
        this.fill("glass_pane", x-4, y+2, z-9, x-4, y+3, z-9);

        this.fill("glass_pane", x-3, y+2, z-11, x+3, y+3, z-11);

        // roof

        this.fill2("oak_stairs", x-5, y+5, z, x+5, y+5, z, 3);
        this.fill2("oak_stairs", x-5, y+5, z-12, x+5, y+5, z-12, 2);
        this.fill2("oak_stairs", x+5, y+5, z, x+5, y+5, z-12, 1);
        this.fill2("oak_stairs", x-5, y+5, z, x-5, y+5, z-12, 8);

        this.fill2("oak_stairs", x-4, y+6, z-1, x+4, y+6, z-1, 3);
        this.fill2("oak_stairs", x-4, y+6, z-11, x+4, y+6, z-11, 2);
        this.fill2("oak_stairs", x+4, y+6, z-1, x+4, y+6, z-11, 1);
        this.fill2("oak_stairs", x-4, y+6, z-1, x-4, y+6, z-11, 8);

    } else if(direction == 4) {


    }
};


const house = `
c = cobblestone
p = planks
w = wood
s = stone_stairs 2
h = chest
_ = air
t = crafting_table
d = door
l = wooden_slab

    w c c c c c w   w c c c c c w   w c g g g c w   w c c c c c w   w p p p p p w   l p p p p p l   _ l p p p l _   _ _ l p l _ _ 
    c p p p p p c   c t b h h _ c   c _ _ _ _ _ c   c _ _ _ _ _ c   p p p p p p p   l p p p p p l   _ l p p p l _   _ _ l p l _ _ 
    c p p p p p c   c _ b _ _ _ c   c _ _ _ _ _ c   c _ _ _ _ _ c   p p p p p p p   l p p p p p l   _ l p p p l _   _ _ l p l _ _ 
    c p p p p p c   c _ _ _ _ _ c   g _ _ _ _ _ c   c _ _ _ _ _ c   p p p p p p p   l p p p p p l   _ l p p p l _   _ _ l p l _ _ 
    c p p p p p c   c _ _ _ _ _ c   c _ _ _ _ _ c   c _ _ _ _ _ c   p p p p p p p   l p p p p p l   _ l p p p l _   _ _ l p l _ _ 
    w c c c c c w   w c c d c c w   w g c d c g w   c _ _ _ _ _ c   p p p p p p p   l p p p p p l   _ l p p p l _   _ _ l p l _ _ 
    _ _ s s s _ _   _ _ _ _ _ _ _   _ _ _ _ _ _ _   _ _ _ _ _ _ _   _ _ _ _ _ _ _   _ _ _ _ _ _ _   _ _ _ _ _ _ _   _ _ _ _ _ _ _
`;

