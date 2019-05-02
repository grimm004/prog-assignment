/* eslint-disable no-console */
/* eslint indent: [2, 4, {"SwitchCase": 1}] */
/* eslint-env node */
/* global Promise */
"use strict";

const mockUitls = require("./firebase-mock-utils");
const objectPath = require("object-path");

const clientFileLocation = `${__dirname}\\firebase\\mock`;
var authData = require("./sample-authData.json");
var database = require("./sample-database.json");

var previousDatabase = JSON.parse(JSON.stringify(database));

function middleware(req, res, next) {
    if (req.method == "GET")
        // Serve the mock firebase app, auth and database script files.
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
            case "/firebase/firebase-config.js":
                res.sendFile(`${__dirname}\\firebase-config.js`);
                break;
            default:
                // If no firebase script is served, move to the next middleware.
                next();
                break;
        }
    else if (req.method == "POST")
        // Switch through the requested location
        switch (req.originalUrl) {
            case "/fbmock-auth-signin":
                if (req.body.email in authData.emails) {
                    authData.accounts[authData.emails[req.body.email]]["signedIn"] = true;
                    res.json({ success: true, user: { uid: authData.emails[req.body.email], email: req.body.email } });
                } else res.json({ success: false, error: { code: "auth/user-not-found", message: "User could not be found." } });
                break;
            case "/fbmock-auth-signup":
                if (req.body.email in authData.emails)
                    res.json({ success: false, error: { code: "auth/email-already-in-use", message: "Email is already in use." } });
                else {
                    console.log("Signup: '" + req.body.email + "' > " + newUid);
                    var newUid = mockUitls.generateUID();
                    authData.emails[req.body.email] = newUid;
                    authData.accounts[newUid] = { email: req.body.email, signedIn: true };
                    res.json({ success: true, user: { uid: newUid, email: req.body.email } });
                    console.log("Auth Data Change:\n" + JSON.stringify(authData, null, 4) + "\n");
                }
                break;
            case "/fbmock-auth-signout":
                authData.accounts[req.body.uid]["signedIn"] = false;
                res.json({});
                break;
            case "/fbmock-auth-getidtoken":
                // Assume the user is who they say they are and return the UID they provide as their ID token
                if (authData.accounts[req.body.uid]["signedIn"])
                    res.json({ success: true, idToken: req.body.uid });
                else res.json({ success: false, error: "Not logged in" });
                break;
            case "/fbmock-db-update":
                databaseUpdate(req.body.ref, req.body.value);
                res.json({ success: true });
                break;
            case "/fbmock-db-set":
                databaseSet(req.body.ref, req.body.value);
                res.json({ success: true });
                break;
            case "/fbmock-db-remove":
                databaseRemove(req.body.ref);
                res.json({ success: true });
                break;
            default:
                // If no firebase mock event is triggered, move on to next middleware
                next();
                break;
        }
    else next();
}

// Check if an object is empty
function objectEmpty(object) {
    return typeof object == "object" && Object.entries(object).length === 0 && object.constructor === Object;
}

// Get a database path for use with the object-path module
function getDbPath(ref) {
    return ref.replace(/\//g, ".");
}

// Set a value in the database
function databaseSet(ref, value) {
    console.log("Set: '" + ref + "' > " + JSON.stringify(value));
    if (objectEmpty(value)) objectPath.del(database, getDbPath(ref));
    else {
        objectPath.set(database, getDbPath(ref), value);
        databaseEvent(ref);
    }
}

// Update a set of values in the database
function databaseUpdate(ref, value) {
    console.log("Update: '" + ref + "' > " + JSON.stringify(value));
    var refData = objectPath.get(database, getDbPath(ref), null);
    if (typeof value === "object" && refData !== null) {
        for (var [entryKey, entryValue] of Object.entries(value))
            if (objectEmpty(entryValue)) objectPath.del(database, getDbPath(ref));
            else refData[entryKey] = entryValue;
    } else if (objectEmpty(value)) objectPath.del(database, getDbPath(ref));
    else objectPath.set(database, getDbPath(ref), value);
    databaseEvent(ref);
}

// Push a value to the database
function databasePush(ref, value) {
    console.log("Push: '" + ref + "' > " + JSON.stringify(value));
    var pushId = mockUitls.generatePushID();
    ref += `/${pushId}`;
    if (!objectEmpty(value)) {
        objectPath.set(database, getDbPath(ref), value);
        databaseEvent(ref);
    }
    return pushId;
}

// Remove data from the database
function databaseRemove(ref) {
    console.log("Remove: '" + ref + "'");
    objectPath.del(database, getDbPath(ref));
    var refParent = ref.split("/").slice(0, -1).join("/");
    if (objectEmpty(objectPath.get(database, getDbPath(refParent)))) objectPath.del(database, getDbPath(refParent));
    databaseEvent(ref);
}

// Warn client listeners that a database change has occurred
function databaseEvent(ref) {
    if (JSON.stringify(database) !== JSON.stringify(previousDatabase)) {
        console.log("Database Change:\n" + JSON.stringify(database, null, 4) + "\n");
        for (var dataListener of dataListeners)
            if (ref.indexOf(dataListener.ref) == 0)
                sendRefData(dataListener.socket, "on", dataListener.ref);
        for (var [listenerRef, listenerCallback] of Object.entries(listenerCallbacks))
            if (ref.indexOf(listenerRef) == 0)
                listenerCallback();
    }
    previousDatabase = JSON.parse(JSON.stringify(database));
}

// Send database data to a socket
function sendRefData(socket, type, ref) {
    socket.emit(ref, { listenerType: type, value: objectPath.get(database, getDbPath(ref), null) });
}

var dataListeners = [];
// Initialise the socket.io listener
function initialiseApp(io) {
    if (io) {
        const dbApp = io.of("/fbmock-db");
        dbApp.on("connection", socket => {
            var listeners = [];

            // Send desired data to user and register a listener
            socket.on("on", data => {
                var listenerInfo = { socket: socket, ref: data.ref };
                listeners.push(listenerInfo);
                dataListeners.push(listenerInfo);
                sendRefData(socket, "on", data.ref);
            });

            // Unregister a listener
            socket.on("off", () => {
                while (listeners.length > 0) {
                    var index = dataListeners.indexOf(listeners.shift());
                    if (index > -1)
                        dataListeners.splice(index, 1);
                }
            });

            // Send desired data to user
            socket.on("once", data => {
                sendRefData(socket, "once", data.ref);
            });
        });
    }
}

// Get a user using their email
function getUserByEmail(email) {
    return new Promise((resolve, reject) => {
        if (email in authData.emails)
            resolve({ uid: authData.emails[email], email: email });
        else reject({ errorInfo: { code: "auth/user-not-found" } });
    });
}

// Get a user using their UID
function getUser(uid) {
    return new Promise((resolve, reject) => {
        if (uid in authData.accounts)
            resolve({ uid: uid, email: authData.accounts[uid].email });
        else reject({ code: "auth/user-not-found" });
    });
}

// Verify a user token
function verifyIdToken(idToken) {
    // To verify an ID token, just look it up in the accounts node to make sure the user is logged in
    return new Promise((resolve, reject) => {
        if (idToken in authData.accounts)
            if (authData.accounts[idToken].signedIn)
                resolve({ uid: idToken, email: authData.accounts[idToken].email });
            else reject({ code: "auth/not-signed-in" });
        else reject({ code: "auth/token-not-valid" });
    });
}

// Define the server-side data snapshot class
class DataSnapshot {
    constructor(ref, data) {
        var refParts = ref.split("/");
        this.key = refParts[refParts.length - 1];
        this.data = data;
    }

    // Return true if the snapshot contains data
    exists() {
        return this.data !== null && typeof this.data !== undefined;
    }

    // Return the stored value
    val() {
        return this.data;
    }

    // Loop through each child
    forEach(callback) {
        if (this.hasChildren())
            for (const [key, value] of Object.entries(this.data))
                callback(new DataSnapshot(key, value));
    }

    // Return true if the snapshot has children
    hasChildren() {
        return this.exists() && typeof this.data === "object" && Object.keys(this.data).length > 0;
    }
}

var listenerCallbacks = {};
// Define the server-side reference class
class Reference {
    constructor(path) {
        // this.reference is formatted without leading or trailing forward slashes
        if (path[0] == "/") path = path.slice(1);
        if (path[path.length - 1] == "/") path = path.slice(0, path.length - 2);
        this.reference = path;
    }

    // Get a child reference
    child(path) {
        if (path.length == 0) return this;
        return new Reference(this.reference + (path[0] != "/" ? "/" : "") + path);
    }

    // Set a database value
    set(value) {
        return new Promise((resolve) => {
            databaseSet(this.reference, value);
            resolve();
        });
    }

    // Update database values
    update(value) {
        return new Promise((resolve) => {
            databaseUpdate(this.reference, value);
            resolve();
        });
    }

    // Push data into the database
    push(value) {
        return { key: databasePush(this.reference, value) };
    }

    // Remove from the database.
    remove() {
        return new Promise((resolve) => {
            databaseRemove(this.reference);
            resolve();
        });
    }

    on(eventType, callback) {
        var intermediateCallback = () => { callback(new DataSnapshot(this.reference, objectPath.get(database, getDbPath(this.reference), null))); };
        listenerCallbacks[this.reference] = intermediateCallback;
        intermediateCallback();
    }

    once(eventType, callback) {
        callback(new DataSnapshot(this.reference, objectPath.get(database, getDbPath(this.reference), null)));
    }

    off() {
        delete listenerCallbacks[this.reference];
    }
}

module.exports = {
    auth: () => {
        return {
            getUserByEmail: getUserByEmail,
            getUser: getUser,
            verifyIdToken: verifyIdToken,
        };
    },
    database: () => {
        return {
            ref: (path) => new Reference(path)
        };
    },
    middleware: middleware,
    initialiseApp: initialiseApp
};
