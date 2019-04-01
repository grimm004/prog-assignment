"use strict";

const forceOnlineFirebase = true;
var environment = process.env.NODE_ENV || 'development';
var express = require("express");
var socket = require("socket.io");
var firebase = null;
if (environment === "production" || forceOnlineFirebase) {
    firebase = require("firebase");
    var firebaseConfig = require("./config_firebase");
    firebase.initializeApp(firebaseConfig);
} else
    firebase = require("./mock_firebase");

class ChatApplication {
    constructor(port, public_folder = "public") {
        this._port = port;

        this._app = express();
        this._app.use(express.static(public_folder, { extensions: ['html', 'htm'], }));
        this._app.use(express.json());

        this._app.post("/login", (req, res) => {
            console.log("Login Requested");
            firebase.auth().signInWithEmailAndPassword(req.body.email, req.body.password)
                .then(user => {
                    console.log("Success...");
                    res.json({ loggedIn: user != null, errorCode: "" });
                })
                .catch(function (error) {
                    console.log("Error logging in '" + req.body.email + "': " + error.code + ", " + error.message);
                    res.json({ loggedIn: false, errorCode: error.code });
                });
        });

        this._app.post("/register", (req, res) => {
            console.log("Register Request: " + req.body.email);

            firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
                .then(() => res.json({ registered: true, errorCode: "" }))
                .catch(function (error) {
                    console.log("Error registering '" + req.body.email + "': " + error.code + ", " + error.message);
                    res.json({ registered: false, errorCode: error.code });
                });
        });

        this._app.post("/status",
            (_, res) => res.json({ loggedIn: firebase.auth().currentUser != null }));

        this._app.post("/logout",
            (_, res) => firebase.auth().signOut()
                .then(() => res.status(200).json({}))
                .catch(error => console.log("Error handling logout request: " + error)));
    }

    get Port() {
        return this._port;
    }

    get ExpressInstance() {
        return this._app;
    }

    start() {
        this._app.listen(this._port);
    }
}

module.exports = ChatApplication;
