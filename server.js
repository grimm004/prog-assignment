"use strict";
const express = require("express");
const JsonDB = require("node-json-db");


class ChatApplication {
    constructor(port, public_folder = "public", databaseFile = "db") {
        this._app = express();
        this._app.use(express.static(public_folder, { extensions: ['html', 'htm'], }));
        this._app.use(express.json());
        
        this._port = port;
        this._databaseFile = databaseFile;
        this._database = new JsonDB(this._databaseFile, true, true);
        
        this._app.post("/login", (req, res) => {
            console.log(req.body);
        });
    }
    
    get Port() {
        return this._port;
    }
    
    set Port(port) {
        this._port = port;
    }
    
    start() {
        this._app.listen(this._port);
    }
}


if (require.main === module) {
    new ChatApplication(8080).start();
}
