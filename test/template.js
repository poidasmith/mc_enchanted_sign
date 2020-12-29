
server = {
    registerSystem: function(v1, v2) {
        return this;
    },
    executeCommand: function(cmd, cb) {
        console.log(cmd);
        cb();
    },
    createEventData: function(type) {
        return {__type___: type};
    },
    broadcastEvent: function(type, ed) {
        //console.log(type);
        //console.log(ed);
        if(type === "minecraft:display_chat_event") {
            console.log(ed.data.message);
        }
    }
};

var {system} = require("../src/scripts/server/server");

//console.log(system);
system.testHouse();