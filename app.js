"use strict";

var express = require("express");
var http = require("http");
var socketio = require("socket.io");

class ChatApplication {
    constructor(port, public_folder = "public") {
        this._port = port;

        this._app = express();
        this._http = http.Server(this._app);
        this._io = socketio(this._http);

        // Express app setup
        if (public_folder)
            this._app.use(express.static(public_folder, { extensions: ['html', 'htm'], }));
        this._app.use(express.json());
    }

    get Port() {
        return this._port;
    }

    get Express() {
        return this._app;
    }

    get SocketIO() {
        return this._io;
    }

    start() {
        this._http.listen(this._port, () => console.log("Started ProgNodeChat server on port " + this.Port + "..."));
    }
}

module.exports = ChatApplication;
