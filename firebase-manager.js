/* eslint-disable no-console */
/* eslint indent: [2, 4, {"SwitchCase": 1}] */
/* eslint-env node */
"use strict";

const path = require("path");

const clientFileLocation = path.join(__dirname, "firebase", "5.9.3");

function getFirebase(io) {
    const admin = require("firebase-admin");
    const adminConfiguration = require("./firebase-admin-config");
    if (adminConfiguration) {
        admin.initializeApp({
            credential: admin.credential.cert(adminConfiguration.credentialData),
            databaseURL: adminConfiguration.databaseURL
        });

        // Store The express middleware function in the firebase admin module
        admin.middleware = (req, res, next) => {
            // Serve the active firebase app, auth and database script files.
            switch (req.originalUrl) {
                case "/firebase/firebase-app.js":
                    res.sendFile(path.join(clientFileLocation, "firebase-app.js"));
                    break;
                case "/firebase/firebase-auth.js":
                    res.sendFile(path.join(clientFileLocation, "firebase-auth.js"));
                    break;
                case "/firebase/firebase-database.js":
                    res.sendFile(path.join(clientFileLocation, "firebase-database.js"));
                    break;
                case "/firebase/firebase-config.js":
                    res.sendFile(`${__dirname}\\firebase-config.js`);
                    break;
                default:
                    // If no firebase script is served, move to the next middleware.
                    next();
                    break;
            }
        };

        return admin;
    } else {
        console.log("Could not find Firebase admin key, starting with Firebase Mock.");
        return getFirebaseMock(io);
    }
}

function getFirebaseMock(io) {
    const mockAdmin = require("./firebase-admin-mock");
    mockAdmin.initialiseApp(io);
    return mockAdmin;
}

module.exports = (onlineFirebase, io) => onlineFirebase ? getFirebase(io) : getFirebaseMock(io);
