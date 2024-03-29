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
    system.setupLogging();
    system.registerEventData("EnchantedSign:Player", {});
    system.listenForEvent("minecraft:client_entered_world", (eventData) => this.onNewPlayer(eventData));
};

system.emit = function(type, data) {
    let ed = this.createEventData(type);
    ed.data = data;
    system.broadcastEvent(type, ed);
};

system.logf = function (message) {
    system.emit("minecraft:display_chat_event", { message: message });
};

system.setupLogging = function() {
    system.emit("minecraft:script_logger_config", {log_errors:true, log_information:true, log_warnings:true});
};

system.onNewPlayer = function(ed) {
    system.emit("EnchantedSign:Player", {player:ed.data.player});
};


