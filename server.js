"use strict";
const onlineFirebase = true;
var environment = process.env.NODE_ENV || 'development';
var express = require("express");
if (environment === "production" || onlineFirebase) {
    var firebase = require("firebase");
    var firebaseConfig = require("./config_firebase");
    firebase.initializeApp(firebaseConfig);
} else {
    var firebase = require("firebase-nightlight").Mock();
}

class ChatApplication {
    constructor(port, public_folder = "public") {
        this._port = port;

        this._app = express();
        this._app.use(express.static(public_folder, { extensions: ['html', 'htm'], }));
        this._app.use(express.json());

        this._app.post("/login", (req, res) => {
            console.log("Login Request: " + req.body.email);

            firebase.auth().signInWithEmailAndPassword(req.body.email, req.body.password)
            .then(function(user) {
                console.log("Success...");
                res.json({ loggedIn: true, errorCode: "" });
            })
            .catch(function(error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log("Error logging in: " + errorCode + ", " + errorMessage);
                res.json({ loggedIn: false, errorCode: errorCode });
            });
        });

        this._app.post("/register", (req, res) => {
            console.log("Register Request: " + req.body.email);

            firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
            .then(function(user) {
                console.log("Success...");
                res.json({ registered: true, errorCode: "" });
            })
            .catch(function(error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log("Error registering: " + errorCode + ", " + errorMessage);
                res.json({ registered: false, errorCode: errorCode });
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
