"use strict";

var firebaseMock = require("firebase-mock");
var mockauth = new firebaseMock.MockAuthentication();
var mockdatabase = new firebaseMock.MockFirebase();
var mockmessaging = new firebaseMock.MockMessaging();
var firebase = new firebaseMock.MockFirebaseSdk(
    path => path ? mockdatabase.child(path) : mockdatabase,
    () => mockauth,
    () => null,
    () => null,
    () => mockmessaging
);
firebase.auth().autoFlush();
firebase.auth().createUser({
    email: 'grimm004@gmail.com',
    password: 'testpassword'
});

module.exports = firebase;
