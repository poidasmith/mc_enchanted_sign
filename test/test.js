
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

const { system } = require("../build/output/scripts/server/server");

system.initialize();
system.build({ x: 0, y: 0, z: 0 }, 11, "template:house");

