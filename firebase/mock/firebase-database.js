/* eslint-disable no-console */
/* eslint-env browser */
/* global firebase fbMockRequest Promise io */
"use strict";

// Connect to the server
const databaseSocket = io("/fbmock-db", { forceNew: true });

// Define the data snapshot class (similar to the server-side one)
class DataSnapshot {
    constructor(ref, data, orderByChild) {
        var refParts = ref.split("/");
        this.key = refParts[refParts.length - 1];
        this.data = data;
        this.orderByChild = orderByChild;
    }

    exists() {
        return this.data !== null && typeof this.data !== undefined;
    }

    val() {
        return this.data;
    }

    forEach(callback) {
        if (this.hasChildren()) {
            var entries = Object.entries(this.data);
            if (this.orderByChild) entries.sort((a, b) => a[this.orderByChild] - b[this.orderByChild]);
            for (const [key, value] of entries)
                callback(new DataSnapshot(key, value));
        }
    }

    hasChildren() {
        return this.exists() && typeof this.data === "object" && Object.keys(this.data).length > 0;
    }
}

// Define the reference class  (similar to the server-side one)
class Reference {
    constructor(path) {
        // this.reference is formatted without leading or trailing forward slashes
        if (path[0] == "/") path = path.slice(1);
        if (path[path.length - 1] == "/") path = path.slice(0, path.length - 2);
        this.reference = path;
        this.listenerCallbacks = {
            once: [],
            on: [],
        };
        databaseSocket.on(this.reference, data => {
            this.listenerCallbacks[data.listenerType].forEach(callback => callback(new DataSnapshot(this.reference, data.value)));
        });
    }

    child(path) {
        if (path.length == 0) return this;
        return new Reference(this.reference + (path[0] != "/" ? "/" : "") + path);
    }

    orderByChild(child) {
        return new Query(this.reference, child);
    }

    set(value) {
        return new Promise((resolve, reject) =>
            fbMockRequest("db-set", { ref: this.reference, value: value })
                .then(response => response.json())
                .then(data => {
                    if (data.success) resolve();
                    else reject(data.error);
                })
        );
    }

    update(value) {
        return new Promise((resolve, reject) =>
            fbMockRequest("db-update", { ref: this.reference, value: value })
                .then(response => response.json())
                .then(data => {
                    if (data.success) resolve();
                    else reject(data.error);
                })
        );
    }

    remove() {
        return new Promise((resolve, reject) =>
            fbMockRequest("db-remove", { ref: this.reference })
                .then(response => response.json())
                .then(data => {
                    if (data.success) resolve();
                    else reject(data.error);
                })
        );
    }

    on(eventType, callback) {
        this.listenerCallbacks["on"].push(callback);
        databaseSocket.emit("on", { ref: this.reference, type: eventType });
    }

    off() {
        this.listenerCallbacks["on"] = [];
        databaseSocket.emit("off", { });
    }

    once(eventType, callback) {
        this.listenerCallbacks["once"].push(callback);
        databaseSocket.emit("once", { ref: this.reference, type: eventType });
    }
}

// Define the query class (similar to the reference class)
class Query {
    constructor(path, orderByChild) {
        // this.reference is formatted without leading or trailing forward slashes
        if (path[0] == "/") path = path.slice(1);
        if (path[path.length - 1] == "/") path = path.slice(0, path.length - 2);
        this.reference = path;
        this.orderByChild = orderByChild.replace(/\//g, ".");
        this.listenerCallbacks = {
            once: [],
            on: [],
        };
        databaseSocket.on(this.reference, data => {
            this.listenerCallbacks[data.listenerType].forEach(callback => callback(new DataSnapshot(this.reference, data.value, this.orderByChild)));
        });
    }

    on(eventType, callback) {
        this.listenerCallbacks["on"].push(callback);
        databaseSocket.emit("on", { ref: this.reference, type: eventType });
    }

    once(eventType, callback) {
        this.listenerCallbacks["once"].push(callback);
        databaseSocket.emit("once", { ref: this.reference, type: eventType });
    }
}

firebase["database"] = () => {
    return {
        ref: location => {
            return new Reference(location);
        }
    };
};
