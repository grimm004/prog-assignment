/* eslint-disable no-console */
/* eslint indent: [2, 4, {"SwitchCase": 1}] */
/* eslint-env node */
/* global Promise */
"use strict";

const mockUitls = require("./firebase-mock-utils");
const objectPath = require("object-path");

const clientFileLocation = `${__dirname}\\firebase\\mock`;
var authData = require(`${clientFileLocation}\\sample-authData.json`);
var database = require(`${clientFileLocation}\\sample-database.json`);

var previousDatabase = JSON.parse(JSON.stringify(database));

function middleware(req, res, next) {
    // Serve the mock firebase app, auth and database script files.
    if (req.method == "GET")
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
    else switch (req.originalUrl) {
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
            next();
            break;
    }
}

function objectEmpty(object) {
    return typeof object == "object" && Object.entries(object).length === 0 && object.constructor === Object;
}

function getDbPath(ref) {
    return ref.replace(/\//g, ".");
}

function databaseSet(ref, value) {
    console.log("Set: '" + ref + "' > " + JSON.stringify(value));
    if (objectEmpty(value)) objectPath.del(database, getDbPath(ref));
    else {
        objectPath.set(database, getDbPath(ref), value);
        databaseEvent(ref);
    }
}

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

function databaseRemove(ref) {
    console.log("Remove: '" + ref + "'");
    objectPath.del(database, getDbPath(ref));
    var refParent = ref.split("/").slice(0, -1).join("/");
    if (objectEmpty(objectPath.get(database, getDbPath(refParent)))) objectPath.del(database, getDbPath(refParent));
    databaseEvent(ref);
}

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

function sendRefData(socket, type, ref) {
    socket.emit(ref, { listenerType: type, value: objectPath.get(database, getDbPath(ref), null) });
}

var dataListeners = [];
function initServer(io) {
    const dbApp = io.of("/fbmock-db");
    dbApp.on("connection", socket => {
        var listeners = [];
        socket.on("on", data => {
            var listenerInfo = { socket: socket, ref: data.ref };
            listeners.push(listenerInfo);
            dataListeners.push(listenerInfo);
            sendRefData(socket, "on", data.ref);
        });
        socket.on("off", () => {
            while (listeners.length > 0) {
                var index = dataListeners.indexOf(listeners.shift());
                if (index > -1)
                    dataListeners.splice(index, 1);
            }
        });
        socket.on("once", data => {
            sendRefData(socket, "once", data.ref);
        });
    });
}

function getUserByEmail(email) {
    return new Promise((resolve, reject) => {
        if (email in authData.emails)
            resolve({ uid: authData.emails[email], email: email });
        else reject({ errorInfo: { code: "auth/user-not-found" } });
    });
}

function getUser(uid) {
    return new Promise((resolve, reject) => {
        if (uid in authData.accounts)
            resolve({ uid: uid, email: authData.accounts[uid].email });
        else reject({ code: "auth/user-not-found" });
    });
}

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

class DataSnapshot {
    constructor(ref, data) {
        var refParts = ref.split("/");
        this.key = refParts[refParts.length - 1];
        this.data = data;
    }

    exists() {
        return this.data !== null && typeof this.data !== undefined;
    }

    val() {
        return this.data;
    }

    forEach(callback) {
        if (this.hasChildren())
            for (const [key, value] of Object.entries(this.data))
                callback(new DataSnapshot(key, value));
    }

    hasChildren() {
        return this.exists() && typeof this.data === "object" && Object.keys(this.data).length > 0;
    }
}

var listenerCallbacks = {};
class Reference {
    constructor(path) {
        // this.reference is formatted without leading or trailing forward slashes
        if (path[0] == "/") path = path.slice(1);
        if (path[path.length - 1] == "/") path = path.slice(0, path.length - 2);
        this.reference = path;
    }

    ref(path) {
        if (path.length == 0) return this;
        return new Reference(this.reference + (path[0] != "/" ? "/" : "") + path);
    }

    set(value) {
        return new Promise((resolve) => {
            databaseSet(this.reference, value);
            resolve();
        });
    }

    update(value) {
        return new Promise((resolve) => {
            databaseUpdate(this.reference, value);
            resolve();
        });
    }

    push(value) {
        return { key: databasePush(this.reference, value) };
    }

    remove() {
        return new Promise((resolve) => {
            databaseRemove(this.reference);
            resolve();
        });
    }

    on(eventType, callback) {
        var intermediateCallback = () => { callback(new DataSnapshot(this.reference, objectPath.get(database, this.reference.replace(/\//g, ".", null)))); };
        listenerCallbacks[this.reference] = intermediateCallback;
        intermediateCallback();
    }

    once(eventType, callback) {
        callback(new DataSnapshot(this.reference, objectPath.get(database, this.reference.replace(/\//g, ".", null))));
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
    initServer: initServer
};
