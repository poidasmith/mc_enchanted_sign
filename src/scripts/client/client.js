var system = client.registerSystem(0,0);

system.initialize = function() {
    this.listenForEvent("minecraft:client_entered_world", (eventData) => this.onNewPlayer(eventData));
    this.registerEventData("EnchantedSign:Player", {});
};

system.log = function (...items) {
    const toString = item => {
        switch (Object.prototype.toString.call(item)) {
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

    this.emit('minecraft:display_chat_event', { message: items.map(toString).join(' ') });
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


