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


