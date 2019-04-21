/* eslint-disable no-console */
/* eslint indent: [2, 4, {"SwitchCase": 1}] */
/* eslint-env node */
"use strict";

var onlineFirebase = true;

const firebaseAdmin = require("firebase-admin");
const firebaseAdminMock = require("./firebase-admin-mock");

// If using online firebase service, initialise the app with an admin key
if (onlineFirebase)
    firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(require("./adminkey.json")),
        databaseURL: "https://prognodechat.firebaseio.com"
    });

const clientFileLocation = `${__dirname}\\firebase\\5.9.3`;

// The express middleware function to be used in a production environment (using the real firebase service)
function middleware(req, res, next) {
    // Serve the active firebase app, auth and database script files.
    switch (req.originalUrl) {
        case "/firebase/firebase-app.js":
            res.sendFile(`${clientFileLocation}\\firebase-app.js`);
            break;
        case "/firebase/firebase-auth.js":
            res.sendFile(`${clientFileLocation}\\firebase-auth.js`);
            break;
        case "/firebase/firebase-database.js":
            res.sendFile(`${clientFileLocation}\\firebase-database.js`);
            break;
        default:
            // If no firebase script is served, move to the next middleware.
            next();
            break;
    }
}

module.exports = {
    admin: onlineFirebase ? firebaseAdmin : firebaseAdminMock,
    middleware: onlineFirebase ? middleware : firebaseAdminMock.middleware,
    initServer: (io) => {
        if (!onlineFirebase)
            firebaseAdminMock.initServer(io);
    }
};
