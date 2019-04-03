"use strict";

var express = require("express");
var http = require("http");
var socketio = require("socket.io");

class ChatApplication {
    constructor(port, public_folder = "public") {
        this.port = port;

        this.app = express();
        this.http = http.Server(this.app);
        this.io = socketio(this.http);

        // Express app setup
        if (public_folder)
            this.app.use(express.static(public_folder, { extensions: ['html', 'htm'], }));
        this.app.use(express.json());
    }

    get Port() {
        return this.port;
    }

    get Express() {
        return this.app;
    }

    get SocketIO() {
        return this.io;
    }

    start() {
        this.http.listen(this.port, () => console.log("Started ProgNodeChat server on port " + this.port + "..."));
    }
}

module.exports = ChatApplication;
