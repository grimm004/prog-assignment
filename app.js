/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
"use strict";

var express = require("express");
var http = require("http");
var socketio = require("socket.io");
var admin = require("firebase-admin");

var serviceAccount = require("./adminkey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://prognodechat.firebaseio.com"
});

var app = express();
var httpServer = http.Server(app);
var io = socketio(httpServer);

app.use(express.static("public", { extensions: ["html", "htm"], }));
app.use(express.json());

// functions.auth.user().onCreate((user) => {
//     // ...
//   });


module.exports = {
    expressApp: app,
    httpServer: httpServer,
    socketIOApp: io,
    add: (a, b) => a + b,
};
