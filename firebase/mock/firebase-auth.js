/* eslint-disable no-console */
/* eslint-env browser */
/* global firebase fbMockRequest Promise */
"use strict";

var currentUser = null;

class User {
    constructor(userInfo) {
        this.uid = userInfo.uid;
        this.email = userInfo.email;
    }

    getIdToken() {
        return new Promise((resolve, reject) =>
            fbMockRequest("auth-getidtoken", { uid: this.uid })
                .then(response => response.json())
                .then(data => {
                    if (data.success) resolve(data.idToken);
                    else reject(data.error);
                })
        );
    }
}

var authStateChangedListeners = [];
function triggerAuthStateChanged(user) {
    currentUser = user;
    for (var i = 0; i < authStateChangedListeners.length; i++)
        authStateChangedListeners[i](user);
}

function signInWithEmailAndPassword(email) {
    // Disgard any provided passwords
    return new Promise((resolve, reject) => {
        fbMockRequest("auth-signin", { email: email })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    var user = new User(data.user);
                    triggerAuthStateChanged(user);
                    resolve(user);
                } else reject(data.error);
            });
    });
}

function createUserWithEmailAndPassword(email) {
    // Disgard any provided passwords
    return new Promise((resolve, reject) =>
        fbMockRequest("auth-signup", { email: email })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    var user = new User(data.user);
                    triggerAuthStateChanged(user);
                    resolve(user);
                } else reject(data.error);
            })
    );
}

function signOut() {
    return new Promise(resolve =>
        fbMockRequest("auth-signout", { uid: currentUser.uid })
            .then(response => response.json())
            .then(() => {
                resolve();
                triggerAuthStateChanged(null);
            })
    );
}

firebase["auth"] = () => {
    return {
        onAuthStateChanged: callback => {
            authStateChangedListeners.push(callback);
        },
        signInWithEmailAndPassword: signInWithEmailAndPassword,
        createUserWithEmailAndPassword: createUserWithEmailAndPassword,
        signOut: signOut,
    };
};
