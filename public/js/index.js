/* eslint-env browser */
/* eslint-disable no-console */
/* global firebase io */
"use strict";

var auth = firebase.auth(),
    db = firebase.database();

$(() => {
    function showSigninWindow() {
        // Hide the chat window divider and show the sign in window divider
        $("#chat-window").hide();
        $("#signin-window").show();
    }

    function showChatWindow() {
        // Hide the sign in window divider and show the chat window divider
        $("#signin-window").hide();
        $("#chat-window").show();
    }

    // Initially show the sign in window
    showSigninWindow();

    var currentUser, socket, currentChatUid;
    auth.onAuthStateChanged(function (user) {
        currentUser = user;
        if (currentUser) onSignin();
        else onSignout();
    });

    var listenerRefs = [];

    function onSignin() {
        // Obtain a database reference to the current user
        var userRef = db.ref(`user/${currentUser.uid}`);

        // Update user profile in database
        userRef.update({
            email: currentUser.email,
            lastSeen: Date.now(),
        });
        // Update user profile on frontend
        $("#profile-email-input").val(currentUser.email);

        // Register firebase listeners for changes in displayName, contact requests and contacts list
        var displayNameRef = userRef.child("displayName");
        displayNameRef.on("value", snapshot => $("#profile-display-name-input").val(snapshot.val() || ""));
        listenerRefs.push(displayNameRef);
        var contactRequestsRef = userRef.child("contactRequests");
        contactRequestsRef.on("value", updateContactRequestList);
        listenerRefs.push(contactRequestsRef);
        var contactsListRef = userRef.child("contacts");
        contactsListRef.on("value", updateContactsList);
        listenerRefs.push(contactsListRef);

        // Create and connect a message socket
        socket = io({ forceNew: true });

        socket.on("message", messageData => {
            if (messageData.senderUid == currentChatUid) outputMessage(messageData);
        });

        socket.on("typing", typingData => {
            var contactDiv = $(`#contacts-list div[name="${typingData.senderUid}"]`);
            contactDiv.find("div.recent-message").html(`${contactDiv.find("div.display-name").text()} is typing...`);
        });

        socket.on("untyping", typingData => {
            db.ref(`user/${currentUser.uid}/contacts/${typingData.senderUid}/recentMessage`).once("value",
                snapshot => {
                    var contactDiv = $(`#contacts-list div[name="${typingData.senderUid}"]`);
                    contactDiv.find("div.recent-message").html(snapshot.val() || `Send ${contactDiv.find("div.display-name").text()} a message...`);
                }
            );
        });

        getIdToken(idToken => {
            socket.emit("auth", { idToken: idToken });
        }, error => console.log(error));

        // Show the chat window
        showChatWindow();
    }

    function onSignout() {
        while (listenerRefs.length > 0)
            listenerRefs.shift().off();
        // Disconnect the message socket
        if (socket) socket.disconnect();
        // Reset all forms
        $("form").trigger("reset");
        // Clear chat, contacts list, contact requests and modal feedback responses
        $("#chat-history *").remove();
        $("#contacts-list *").remove();
        $("#add-contact-feedback *").remove();
        $("#profile-update-feedback *").remove();
        currentChatUid = "";
        // Show the sign in window
        showSigninWindow();
    }

    function getIdToken(successCallback, errorCallback) {
        currentUser.getIdToken(true)
            .then(successCallback)
            .catch(errorCallback);
    }

    var disableContactInteraction = () => $("#contact-requests :button, #submit-contact-button, #contact-email-input").prop("disabled", true);
    var enableContactInteraction = () => $("#contact-requests :button, #submit-contact-button, #contact-email-input").prop("disabled", false);

    $("#add-contact-form").submit(
        event => {
            event.preventDefault();

            var addContactMessages = {
                "auth/user-not-found": "User could not be found.",
                "request-already-sent": "A contact request has already been sent.",
                "contact-added": "Contact has been added.",
                "request-sent": "Contact request has been sent.",
                "already-contacts": "Already contacts."
            };

            disableContactInteraction();

            var email = $("#contact-email-input").val();
            if (validEmail(email) && email != currentUser.email)
                getIdToken(idToken => {
                    post("/addcontact", { idToken: idToken, contactEmail: email })
                        .then(response => response.json())
                        .then(responseData => {
                            $("#add-contact-feedback").html(
                                `
                                <span class="text-${responseData.success ? "success" : "danger"}">
                                    <strong>${responseData.success ? "Success" : "Error adding contact"}:</strong>
                                    ${responseData.code in addContactMessages ? addContactMessages[responseData.code] : "An unknown error occurred."}
                                </span>
                                `
                            );
                            if (responseData.success) $("#contact-email-input").val("");
                            enableContactInteraction();
                        });
                }, error => {
                    console.log("Error occurred while accessing login token: " + error);
                    enableContactInteraction();
                });
            else {
                $("#add-contact-feedback").html("<span class=\"text-warning\"><strong>Error adding contact</strong>: Invalid email entered.</span>");
                enableContactInteraction();
            }
        }
    );

    $("#profile-update-form").submit(
        e => {
            e.preventDefault();

            db.ref(`user/${currentUser.uid}/`).update({
                displayName: $("#profile-display-name-input").val(),
            })
                .then(() => $("#profile-update-feedback").html("<p class=\"text-success\">Successfully updated profile.</p>"))
                .catch(() => $("#profile-update-feedback").html("<p class=\"text=danger\">Error updating profile.</p>"));
        }
    );

    function openChat(contactUid) {
        if (!$(`div#contacts-list > div[name="${contactUid}"]`).hasClass("selected-contact") && currentChatUid != contactUid) {
            markAsUntyping();
            $("#message-input").val("");

            currentChatUid = contactUid;
            $("#chat-history *").remove();

            getIdToken(idToken =>
                post("/messages", { idToken: idToken, contact: currentChatUid })
                    .then(response => response.json())
                    .then(responseData => {
                        responseData.messages.forEach(message => { outputMessage(message); });
                    }), error => console.log(error));
        }
        $("div#contacts-list > div").removeClass("selected-contact");
        $(`div#contacts-list > div[name="${currentChatUid}"]`).addClass("selected-contact");
        db.ref(`user/${currentUser.uid}/contacts/${currentChatUid}/recentMessageViewed`).once("value", snapshot => {
            if (!snapshot.val())
                db.ref(`user/${currentUser.uid}/contacts/${currentChatUid}/recentMessageViewed`).set(true);
        });
    }

    function updateContactsList(contactListSnapshot) {
        $("#contacts-list *").remove();
        if (contactListSnapshot.hasChildren()) {
            contactListSnapshot.forEach(contact_ => {
                var contactUid = contact_.key;
                var contact = contact_.val();

                var displayNameDiv = $("<div/>")
                    .attr("class", "display-name")
                    .html("Loading...");
                var recentMessageDiv = $("<div/>")
                    .attr("class", "recent-message")
                    .html("Loading...");
                var contactDiv = $("<div/>")
                    .attr("class", "contact")
                    .attr("name", contactUid)
                    .append(displayNameDiv, recentMessageDiv)
                    .click(function () { openChat(contactUid); });

                if (!contact.recentMessageViewed) recentMessageDiv.addClass("unread");

                db.ref(`user/${contactUid}/displayName`).once("value",
                    displayNameSnapshot => {
                        if (displayNameSnapshot.exists()) {
                            var displayName = displayNameSnapshot.val();
                            displayNameDiv.text(displayName);
                            recentMessageDiv.text(contact.recentMessage || `Send ${displayName} a message...`);
                        }
                        else db.ref(`user/${contactUid}/email`).once("value",
                            emailSnapshot => {
                                var displayName = emailSnapshot.exists() ? emailSnapshot.val() : contactUid;
                                displayNameDiv.text(displayName);
                                recentMessageDiv.text(contact.recentMessage || `Send ${displayName} a message...`);
                            });
                    }, error => console.log(error));

                $("#contacts-list").prepend(contactDiv);
            });
            openChat(currentChatUid || $("#contacts-list div:first-child").attr("name"));
            $("#message-input").prop("disabled", false);
        } else {
            $("#message-input").prop("disabled", true);
            $("#contacts-list").append("<div class=\"text-center text-primary p-2\"><a href=\"\" data-toggle=\"modal\" data-target=\"#add-contacts-modal\">Add contacts</a></div>");
        }
    }

    function updateContactRequestList(contactRequestSnapshot) {
        if (!contactRequestSnapshot.exists()) $("#contact-requests").html("<div class=\"text-center pt-2\">No incoming contact requests.</div>");
        else {
            $("#contact-requests *").remove();
            contactRequestSnapshot.forEach(
                contactRequest => {
                    var email = contactRequest.val().email;
                    var acceptButton = $("<button/>")
                        .text("Accept")
                        .attr("class", "btn btn-success btn-sm")
                        .attr("type", "button")
                        .click(() => { disableContactInteraction(); acceptContactRequest(contactRequest.key); });

                    var declineButton = $("<button/>")
                        .text("Decline")
                        .attr("class", "btn btn-danger btn-sm")
                        .attr("type", "button")
                        .click(() => { disableContactInteraction(); removeContactRequest(contactRequest.key); });

                    var buttons = $("<div/>")
                        .attr("class", "btn-group float-right")
                        .attr("role", "group")
                        .append(acceptButton, declineButton);

                    var column = $("<div/>")
                        .attr("class", "col")
                        .append(`<div class="d-inline">${email}</div>`, buttons);

                    var requestRow = $("<div/>")
                        .attr("class", "row pb-1")
                        .attr("name", email)
                        .append(column);

                    $("#contact-requests").append(requestRow);
                }
            );
        }
    }

    function acceptContactRequest(uid) {
        getIdToken(
            idToken => {
                post("/acceptcontact", { idToken: idToken, contact: uid })
                    .then(response => response.json())
                    .then(() => {
                        enableContactInteraction();
                    });
            },
            error => {
                console.log(error);
                enableContactInteraction();
            }
        );
    }

    function removeContactRequest(uid) {
        db.ref(`user/${currentUser.uid}/contactRequests/${uid}`).remove()
            .then(() => {
                enableContactInteraction();
            });
    }

    // Handle sending of messages
    $("#message-form").submit(
        e => {
            e.preventDefault();

            if (currentChatUid) {
                var messageText = $("#message-input").val();
                if (!isNullOrWhiteSpace(messageText)) {
                    typing = false;
                    $("#message-input").val("");
                    sendMessage(messageText);
                }
            }
        }
    );

    function sendMessage(messageText) {
        getIdToken(
            idToken => {
                var timestamp = Date.now();
                socket.emit("message", { idToken: idToken, targetUid: currentChatUid, text: messageText, timestamp: timestamp });
                outputMessage({ senderUid: currentUser.uid, text: messageText, timestamp: timestamp });
            },
            error => console.log(error)
        );
    }

    function outputMessage(messageData) {
        if (currentUser && messageData) {
            var type = messageData.senderUid == currentUser.uid ? "outgoing" : "incoming";
            $("#chat-history").append(`<div class="message" data-timestamp="${messageData.timestamp}"><div class="${type}">${messageData.text}</div></div>`);
            if (type == "outgoing") scrollToBottom();
            else updateScroll();
        }
    }

    // Handle automatic scrolling
    $("#chat-history-row").scroll(function () { autoScroll = $(this).scrollTop() + $(this).height() >= this.scrollHeight - 1; });
    $("#signout-button").click(() => auth.signOut());

    var autoScroll = true;
    function updateScroll() {
        if (autoScroll)
            scrollToBottom();
    }

    function scrollToBottom() {
        $("#chat-history-row").scrollTop($("#chat-history-row")[0].scrollHeight);
    }

    scrollToBottom();

    // Handle placement of Contacts List
    $(window).on("resize", placeContacts);

    var contactsInSidebar = true;
    placeContacts();
    function placeContacts() {
        var environment = findBootstrapEnvironment();
        if (environment == "xs" && contactsInSidebar) {
            contactsInSidebar = false;
            $("#contacts-list").detach().appendTo("#contacts-list-modal-body");
        } else if (environment != "xs" && !contactsInSidebar) {
            contactsInSidebar = true;
            $("#contacts-list").detach().appendTo("#sidebar");
        }
    }

    // Disable message input
    $("#message-input").prop("disabled", false);

    var typing = false;
    var typingTargetUid = "";
    $("#message-input").on("input", () => {
        if (typing && $("#message-input").val() == "") markAsUntyping();
        else if (!typing && $("#message-input").val() != "") markAsTyping();
    });

    function markAsTyping() {
        typing = true;
        getIdToken(
            idToken => {
                typingTargetUid = currentChatUid;
                socket.emit("typing", { idToken: idToken, targetUid: typingTargetUid });
            },
            error => console.log(error)
        );
    }

    function markAsUntyping() {
        typing = false;
        getIdToken(
            idToken => {
                socket.emit("untyping", { idToken: idToken, targetUid: typingTargetUid });
                typingTargetUid = "";
            },
            error => console.log(error)
        );
    }

    initLogin();
});

function initLogin() {
    var signin = true;
    $("#switch-button").click(() => {
        if (signin) showSignup();
        else showSignin();
    });

    function showSignup() {
        signin = false;
        $("#switch-button").fadeOut(200, function () {
            $("#confirm-password-input").fadeIn(400, () => {
                $(this).text("Back").fadeIn(200);
                $("#submit-button").text("Sign up").fadeIn(200);
            });
        });
        $("#title, #submit-button").fadeOut(200);
        $("#title").fadeOut(400, function () { $(this).text("Sign up").fadeIn(400); });
    }

    function showSignin() {
        signin = true;
        $("#confirm-password-input").val("");
        $("#switch-button").fadeOut(200, function () {
            $("#confirm-password-input").fadeOut(400, () => {
                $(this).text("Sign up").fadeIn(200);
                $("#submit-button").text("Sign in").fadeIn(200);
            });
        });
        $("#submit-button").fadeOut(200);
        $("#title").fadeOut(400, function () { $(this).text("Sign in").fadeIn(400); });
    }

    function clearSignin() {
        $("#email-input").val("");
        $("#password-input").val("");
        $("#confirm-password-input").val("");
    }

    $("#signin-signup-form").submit(function (event) {
        event.preventDefault();

        var signinMessages = {
            "auth/wrong-password": "Invalid email or password.",
            "auth/user-not-found": "Invalid email or password.",
            "auth/weak-password": "Password is too weak.",
            "auth/too-many-requests": "To many unsuccessful login attemts.",
            "auth/email-already-in-use": "This email is already in use."
        };

        if (dataValidation())
            if (signin)
                auth.signInWithEmailAndPassword($("#email-input").val(), $("#password-input").val())
                    .then(resetSignin)
                    .catch(
                        error => {
                            if (error.code in signinMessages)
                                showAlert("danger", "Error signing in:", signinMessages[error.code], 5000);
                            else { console.log(error.code); showAlert("danger", "Error signing in:", error.message, 5000); }
                        }
                    );
            else
                auth.createUserWithEmailAndPassword($("#email-input").val(), $("#password-input").val())
                    .then(resetSignin)
                    .catch(
                        error => {
                            if (error.code in signinMessages)
                                showAlert("danger", "Error signing up:", signinMessages[error.code], 5000);
                            else showAlert("danger", "Error signing up:", error.message, 5000);
                        }
                    );
    });

    function resetSignin() {
        showSignin();
        clearSignin();
        clearAlerts();
    }

    function dataValidation() {
        var errorTitle = signin ? "Error signing in" : "Error signing up";
        if (!validEmail($("#email-input").val())) {
            showAlert("danger", errorTitle, "Please enter a valid email.", 5000);
            return false;
        }

        if ($("#password-input").val().length < 6 || (!signin && $("#confirm-password-input").val().length < 6)) {
            showAlert("danger", errorTitle, "Passwords must be of 6 or more characters in length.", 5000);
            return false;
        }

        if (!signin && !passwordsMatch()) {
            showAlert("danger", errorTitle, "Please ensure passwords match.", 5000);
            return false;
        }

        return true;
    }

    function passwordsMatch() {
        return $("#password-input").val() == $("#confirm-password-input").val();
    }

    var alertId = 0;
    function showAlert(type, title, message, timeout) {
        $("#alerts").append(`
        <div name="alert-${alertId}" class="alert alert-${type} alert-dismissible fade show">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            <strong>${title}</strong> ${message}
        </div>
        `);
        $(`#alerts [name='alert-${alertId}']`).on("closed.bs.alert",
            (() => {
                var currentAlertId = alertId;
                return () => $(`#alerts [name='alert-${currentAlertId}']`).remove();
            })());
        if (timeout)
            setTimeout(
                (() => {
                    var currentAlertId = alertId;
                    return () => $(`#alerts div[name='alert-${currentAlertId}']`).alert("close");
                })(), timeout);
        alertId++;
    }

    function clearAlerts() {
        $("#alerts").html("");
    }
}

// Perform a post request to the server and return the promise
function post(location, object) {
    return fetch(location, {
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

// Return true if the provided text is null or white space
function isNullOrWhiteSpace(text) {
    return text === null || /^\s*$/.test(text);
}

/* Window size class idenfication from https://stackoverflow.com/questions/14441456/how-to-detect-which-device-view-youre-on-using-twitter-bootstrap-api */
function findBootstrapEnvironment() {
    let envs = ["xs", "sm", "md", "lg", "xl"];

    let el = document.createElement("div");
    document.body.appendChild(el);

    let curEnv = envs.shift();

    for (let env of envs.reverse()) {
        el.classList.add(`d-${env}-none`);

        if (window.getComputedStyle(el).display === "none") {
            curEnv = env;
            break;
        }
    }

    document.body.removeChild(el);
    return curEnv;
}

/* Email validation regex from https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript */
function validEmail(email) {
    return /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i.test(String(email).toLowerCase());
}
