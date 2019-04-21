/* global firebase */
"use strict";

var config = {
    apiKey: "(project key)",
    authDomain: "(project auth domain).firebaseapp.com",
    databaseURL: "https://(project id).firebaseio.com",
    projectId: "(project id)",
    storageBucket: "(project id).appspot.com",
    messagingSenderId: "(id)"
};
firebase.initializeApp(config);
