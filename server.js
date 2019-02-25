"use strict";
var environment = process.env.NODE_ENV || 'development';
var express = require("express");
if (environment === "production") {
    var firebase = require("firebase");
    firebase.initializeApp(firebaseConfig);
} else {
    var firebase = require("firebase-nightlight").Mock();
}
var firebaseConfig = require("./config_firebase");

class ChatApplication {
    constructor(port, public_folder = "public") {
        this._port = port;

        this._app = express();
        this._app.use(express.static(public_folder, { extensions: ['html', 'htm'], }));
        this._app.use(express.json());

        this._app.post("/login", (req, res) => {
            console.log("Login Request: " + req.body);
        });

        this._app.post("/register", (req, res) => {
            console.log("Register Request: " + req.body);
            
            firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log("Error registering account: " + errorCode + ", " + errorMessage);
            });
        });
    }

    get Port() {
        return this._port;
    }

    start() {
        this._app.listen(this._port);
    }
}


if (require.main === module) {
    new ChatApplication(8080).start();
}
