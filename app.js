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

app.use(express.static("public", { extensions: ["html", "htm", "ico", "png"], }));
app.use(express.json());

app.post("/addcontact",
    (req, res) => {
        admin.auth().verifyIdToken(req.body.idToken)
            .then(
                decodedToken => {
                    admin.auth().getUserByEmail(req.body.contact)
                        .then(
                            user => {
                                admin.database().ref(`user/${user.uid}/contactRequests`).push(decodedToken.email);
                            }
                        )
                        .catch(function (error) {
                            console.log("Error fetching user data:", error);
                        });
                    res.json({});
                }
            ).catch(
                error => {
                    console.log("Error occurred authenticating contact add request: ", error);
                }
            );
    }
);

io.on("connection",
    socket => {
        socket["hasAuth"] = false;
        socket["email"] = "";
        socket["contacts"] = [];
        socket.on("auth",
            data => {
                admin.auth().verifyIdToken(data.idToken)
                    .then(
                        decodedToken => {
                            socket.email = decodedToken.email;
                            socket.hasAuth = true;
                            admin.database().ref(`user/${decodedToken.uid}/contacts`).on("value",
                                snapshot => socket.contacts = snapshot.val()
                            );
                        }
                    ).catch(
                        error => {
                            console.log("Error occurred authenticating connection: ", error);
                        }
                    );
            }
        );

        socket.on("fetchmessages",
            data => {
                admin.database().ref("receivedMessages")
            }
        );

        socket.on("message",
            data => {
                var messageId = admin.database().ref("messages").push({ from: socket.email, to: data.email, timestamp: Date.now(), message: data.message }).getKey();
                admin.database().ref(`sentMessages/${socket.email}`).push({ messageId: messageId });
                admin.database().ref(`receivedMessages/${data.email}`).push({ messageId: messageId });
                io.sockets.clients().forEach(
                    _socket => {
                        if (_socket.email == data.email) {
                            _socket.emit("message", data.message);
                            console.log("Message sent to " + _socket.email);
                        }
                    }
                );
            }
        );
    }
);

module.exports = {
    expressApp: app,
    httpServer: httpServer,
    socketIOApp: io,
    add: (a, b) => a + b,
};
