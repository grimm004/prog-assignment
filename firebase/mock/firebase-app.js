/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-env browser */
/* exported firebase */
"use strict";

console.warn("Using mock firebase client. Passwords are assumed to be correct and are not sent to any server.");

// Submit a firebase mock request to the server
function fbMockRequest(request, object) {
    return fetch(`/fbmock-${request}`, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(object)
    });
}

var firebase = {
    initializeApp: () => { }
};
