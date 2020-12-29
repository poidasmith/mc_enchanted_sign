var system = client.registerSystem(0,0);

system.initialize = function() {
    this.listenForEvent("minecraft:client_entered_world", (eventData) => this.onNewPlayer(eventData));
    this.listenForEvent("minecraft:pick_hit_result_changed", (eventData) => this.onPick(eventData));
};

system.update = function() {

};

system.shutdown = function() {


};

system.log = function(message) {
    this.emit("minecraft:display_chat_event", {message:message});
};

system.emit = function(type, data) {
    let ed = this.createEventData(type);
    ed.data = data;
    this.broadcastEvent(type, ed);
};

system.onNewPlayer = function(ed) {
    this.log("Player entered!");
    this.emit("EnchantedSign:Player", {player:ed.data.player});
};

system.onPick = function(ed) {
    //this.log("Pick event", ed);
}

