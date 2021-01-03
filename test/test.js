
// A mock server system, used for testing

server = {
    registerSystem: function (v1, v2) {
        return this;
    },
    executeCommand: function (cmd, cb) {
        console.log(cmd);
        cb();
    },
    createEventData: function (type) {
        return { __type___: type };
    },
    broadcastEvent: function (type, ed) {
        //console.log(type);
        //console.log(ed);
        if (type === "minecraft:display_chat_event") {
            console.log(ed.data.message);
        }
    },
    listenForEvent: function(type, cb) {
        
    }
};

const { system, templates, macros, templater } = require("../build/output/scripts/server/server");

//console.log(templates);

system.initialize();
const origin = { x: 0, y: 0, z: 0 };

/*
system.build(origin, "south", "template:lamp");

var well = templater.parse(templates.well);
console.log(well);
templater.fillTemplate(well, origin, "south");

console.log(templater.directionOfSign({data:{facing_direction:2}}));
*/

console.log(templater.parse(macros.test1).layers[0][0]);

system.build(origin, "north", "macro:test1");
