/* eslint-env browser */
/* eslint-disable no-console */
/* global firebase io */
"use strict";

// Access firebase auth and database modules
const auth = firebase.auth(), db = firebase.database();

$(() => {
    let typing;

    /* Window View Control */
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

    /* Authentication Management */
    // 
    let currentUser, socket, currentChatUid;
    auth.onAuthStateChanged(function (user) {
        currentUser = user;
        if (currentUser) onSignin();
        else onSignout();
    });

    const listenerRefs = [];

    function onSignin() {
        // Obtain a database reference to the current user
        const userRef = db.ref(`user/${currentUser.uid}`);

        // Update user profile in database
        userRef.update({
            email: currentUser.email,
            lastSeen: Date.now(),
        });
        // Update user profile on frontend
        $("#profile-email-input").val(currentUser.email);

        // Register firebase listeners for changes in displayName, contact requests and contacts list
        const displayNameRef = userRef.child("displayName");
        displayNameRef.on("value", snapshot => $("#profile-display-name-input").val(snapshot.val() || ""));
        listenerRefs.push(displayNameRef);
        const contactRequestsRef = userRef.child("contactRequests");
        contactRequestsRef.on("value", updateContactRequestList);
        listenerRefs.push(contactRequestsRef);
        const contactsListRef = userRef.child("contacts");
        // Order the contacts list by the latest message timestamp
        contactsListRef.orderByChild("recentMessageTimestamp").on("value", updateContactsList);
        listenerRefs.push(contactsListRef);

        // Create and connect a socket
        socket = io({ forceNew: true });

        // Create a listener for messages
        socket.on("message", messageData => {
            if (messageData.senderUid == currentChatUid) outputMessage(messageData);
        });

        // Create a listener for typing status
        socket.on("typing", typingData => {
            const contactDiv = $(`#contacts-list div[name="${typingData.senderUid}"]`);
            contactDiv.find("div.recent-message").html(`${contactDiv.find("div.display-name").text()} is typing...`);
        });

        // Create a listener for untyping status
        socket.on("untyping", typingData => {
            db.ref(`user/${currentUser.uid}/contacts/${typingData.senderUid}/recentMessage`).once("value",
                snapshot => {
                    const contactDiv = $(`#contacts-list div[name="${typingData.senderUid}"]`);
                    contactDiv.find("div.recent-message").html(snapshot.val() || `Send ${contactDiv.find("div.display-name").text()} a message...`);
                }
            );
        });

        // Send the server client auth information
        getIdToken(idToken => {
            socket.emit("auth", { idToken: idToken });
        }, error => console.log(error));

        // Show the chat window
        showChatWindow();
    }

    function onSignout() {
        // Show the sign in window
        showSigninWindow();
        
        // Remove database listeners
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
        // Reset the current chat contact uid
        currentChatUid = "";
    }

    // Shorthand function to access an ID token
    function getIdToken(successCallback, errorCallback) {
        currentUser.getIdToken(true)
            .then(successCallback)
            .catch(errorCallback);
    }

    // Function to disable interaction with the contact requests list and add contact form
    const disableContactInteraction = () => $("#contact-requests :button, #submit-contact-button, #contact-email-input").prop("disabled", true);
    // Function to enable interaction with the contact requests list and add contact form
    const enableContactInteraction = () => $("#contact-requests :button, #submit-contact-button, #contact-email-input").prop("disabled", false);

    // On submission of the add contacts form...
    $("#add-contact-form").submit(
        event => {
            // Prevent the page from reloading
            event.preventDefault();

            // Define messages for potential response codes
            const addContactMessages = {
                "auth/user-not-found": "User could not be found.",
                "request-already-sent": "A contact request has already been sent.",
                "contact-added": "Contact has been added.",
                "request-sent": "Contact request has been sent.",
                "already-contacts": "Already contacts."
            };

            disableContactInteraction();

            // Access and validate the target email (checking it is an email and is not the same address as that of the client sending the request)
            const email = $("#contact-email-input").val();
            if (validEmail(email) && email !== currentUser.email)
                getIdToken(idToken => {
                    // POST request to the server to add the email address as a contact
                    post("/addcontact", { idToken: idToken, contactEmail: email })
                        .then(response => response.json())
                        .then(responseData => {
                            // Output the feedback from the server
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

    // On submission of the profile update form...
    $("#profile-update-form").submit(
        e => {
            e.preventDefault();

            // Update the profile information in the database
            db.ref(`user/${currentUser.uid}/`).update({
                displayName: $("#profile-display-name-input").val(),
            })
                // Provide success or failure feedback
                .then(() => $("#profile-update-feedback").html("<p class=\"text-success\">Successfully updated profile.</p>"))
                .catch(() => $("#profile-update-feedback").html("<p class=\"text=danger\">Error updating profile.</p>"));
        }
    );

    // Open a conversation with a contact
    function openConversation(contactUid) {
        // Check if the conversation is not already selected
        if (!$(`div#contacts-list > div[name="${contactUid}"]`).hasClass("selected-contact") && currentChatUid != contactUid) {
            markAsUntyping();
            $("#message-input").val("");

            // Store the current conversation contact ID
            currentChatUid = contactUid;
            // Delete chat history
            $("#chat-history *").remove();

            // Fetch the messages from the server
            getIdToken(idToken =>
                post("/messages", { idToken: idToken, contact: currentChatUid })
                    .then(response => response.json())
                    .then(responseData => {
                        responseData.messages.forEach(message => { outputMessage(message); });
                    }), error => console.log(error));
        }
        // Apply selection styling to the contacts list
        $("div#contacts-list > div").removeClass("selected-contact");
        $(`div#contacts-list > div[name="${currentChatUid}"]`).addClass("selected-contact");
        // If not already viewed, mark the conversation as having been viewed
        db.ref(`user/${currentUser.uid}/contacts/${currentChatUid}/recentMessageViewed`).once("value", snapshot => {
            if (!snapshot.val())
                db.ref(`user/${currentUser.uid}/contacts/${currentChatUid}/recentMessageViewed`).set(true);
        });
    }

    // On database change of the contacts list...
    function updateContactsList(contactListSnapshot) {
        // Remove everything from the contacts list
        $("#contacts-list *").remove();
        // If the update contains contacts...
        if (contactListSnapshot.hasChildren()) {
            // Loop through each contact
            contactListSnapshot.forEach(contact_ => {
                // Add the contact to the contacts list
                const contactUid = contact_.key;
                const contact = contact_.val();

                const displayNameDiv = $("<div/>")
                    .attr("class", "display-name")
                    .html("Loading...");
                const recentMessageDiv = $("<div/>")
                    .attr("class", "recent-message")
                    .html("Loading...");
                const contactDiv = $("<div/>")
                    .attr("class", "contact")
                    .attr("name", contactUid)
                    .append(displayNameDiv, recentMessageDiv)
                    .click(function () { openConversation(contactUid); });

                if (!contact.recentMessageViewed) recentMessageDiv.addClass("unread");

                db.ref(`user/${contactUid}/displayName`).once("value",
                    displayNameSnapshot => {
                        if (displayNameSnapshot.exists()) {
                            const displayName = displayNameSnapshot.val();
                            displayNameDiv.text(displayName);
                            recentMessageDiv.text(contact.recentMessage || `Send ${displayName} a message...`);
                        }
                        else db.ref(`user/${contactUid}/email`).once("value",
                            emailSnapshot => {
                                const displayName = emailSnapshot.exists() ? emailSnapshot.val() : contactUid;
                                displayNameDiv.text(displayName);
                                recentMessageDiv.text(contact.recentMessage || `Send ${displayName} a message...`);
                            });
                    }, error => console.log(error));

                $("#contacts-list").prepend(contactDiv);
            });
            // Open the previously selected conversation if it exists, else open the first conversation
            openConversation(currentChatUid || $("#contacts-list div:first-child").attr("name"));
            // Enable message input
            $("#message-input").prop("disabled", false);
        } else {
            // If there are no contacts in the update, disable message input
            $("#message-input").prop("disabled", true);
            // Add a prompt for the user to add contacts
            $("#contacts-list").append("<div class=\"text-center text-primary p-2\"><a href=\"\" data-toggle=\"modal\" data-target=\"#add-contacts-modal\">Add contacts</a></div>");
        }
    }

    // On a database change of the contact requests list...
    function updateContactRequestList(contactRequestSnapshot) {
        // If there are no contact request, display this to the user
        if (!contactRequestSnapshot.exists()) $("#contact-requests").html("<div class=\"text-center pt-2\">No incoming contact requests.</div>");
        else {
            // If there are contact request, clear the contact requests area
            $("#contact-requests *").remove();
            // Loop through each contact request
            contactRequestSnapshot.forEach(
                contactRequest => {
                    // Add the contact request to the contact requests list
                    const email = contactRequest.val().email;
                    const acceptButton = $("<button/>")
                        .text("Accept")
                        .attr("class", "btn btn-success btn-sm")
                        .attr("type", "button")
                        .click(() => { disableContactInteraction(); acceptContactRequest(contactRequest.key); });

                    const declineButton = $("<button/>")
                        .text("Decline")
                        .attr("class", "btn btn-danger btn-sm")
                        .attr("type", "button")
                        .click(() => { disableContactInteraction(); removeContactRequest(contactRequest.key); });

                    const buttons = $("<div/>")
                        .attr("class", "btn-group float-right")
                        .attr("role", "group")
                        .append(acceptButton, declineButton);

                    const column = $("<div/>")
                        .attr("class", "col")
                        .append(`<div class="d-inline">${email}</div>`, buttons);

                    const requestRow = $("<div/>")
                        .attr("class", "row pb-1")
                        .attr("name", email)
                        .append(column);

                    $("#contact-requests").append(requestRow);
                }
            );
        }
    }

    // Accept a contact request
    function acceptContactRequest(uid) {
        getIdToken(
            idToken => {
                // Send an acceptcontact POST request to the server
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

    // Decline a contact request
    function removeContactRequest(uid) {
        // Directly delete the contact request from the database
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
                // Access the message
                const messageText = $("#message-input").val();
                // If the message is not empty or white space
                if (!isNullOrWhiteSpace(messageText)) {
                    typing = false;
                    // Empty the message input box
                    $("#message-input").val("");
                    // Send the message to the client
                    sendMessage(messageText);
                }
            }
        }
    );

    // Send a message to the current conversation contact
    function sendMessage(messageText) {
        getIdToken(
            idToken => {
                const timestamp = Date.now();
                // Send the message information to the server
                socket.emit("message", { idToken: idToken, targetUid: currentChatUid, text: messageText, timestamp: timestamp });
                // Output the message locally
                outputMessage({ senderUid: currentUser.uid, text: messageText, timestamp: timestamp });
            },
            error => console.log(error)
        );
    }

    // Output a message to the message history box
    function outputMessage(messageData) {
        if (currentUser && messageData) {
            // Derive from the message data whether the message is incoming or outgoing
            const type = messageData.senderUid == currentUser.uid ? "outgoing" : "incoming";
            // Append the message to the chat history
            $("#chat-history").append(`<div class="message" data-timestamp="${messageData.timestamp}"><div class="${type}">${messageData.text}</div></div>`);
            if (type == "outgoing") scrollToBottom();
            else updateScroll();
        }
    }

    let autoScroll = true;

    // Handle automatic scrolling
    $("#chat-history-row").scroll(function () { autoScroll = $(this).scrollTop() + $(this).height() >= this.scrollHeight - 1; });
    $("#signout-button").click(() => auth.signOut());

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

    let contactsInSidebar = true;
    placeContacts();
    function placeContacts() {
        const environment = findBootstrapEnvironment();
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

    // Handle marking user as typing in conversations
    typing = false;
    let typingTargetUid = "";
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
    let signin = true;
    // Toggle between signin and signup form
    $("#switch-button").click(() => {
        if (signin) showSignup();
        else showSignin();
    });

    // Show the sign-up form
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

    // Show the sign-in form
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

    // Clear all sign in / sign up parameters
    function clearSignin() {
        $("#email-input").val("");
        $("#password-input").val("");
        $("#confirm-password-input").val("");
    }

    // On submission of the sign in or sign up form...
    $("#signin-signup-form").submit(function (event) {
        event.preventDefault();

        // Define messages for possible common response codes.
        var signinMessages = {
            "auth/wrong-password": "Invalid email or password.",
            "auth/user-not-found": "Invalid email or password.",
            "auth/weak-password": "Password is too weak.",
            "auth/too-many-requests": "To many unsuccessful login attemts.",
            "auth/email-already-in-use": "This email is already in use."
        };

        // If the form validates correctly
        if (dataValidation())
            // If the user is signing in
            if (signin)
                // Send a sign in request to Firebase
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
                // If the user is signing up, send a sign up request to Firebase
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

    // Reset the sign-in page
    function resetSignin() {
        showSignin();
        clearSignin();
        clearAlerts();
    }

    // Perform data validation on sign in and sign up input fields
    function dataValidation() {
        const errorTitle = signin ? "Error signing in" : "Error signing up";
        // Check the email is valid
        if (!validEmail($("#email-input").val())) {
            showAlert("danger", errorTitle, "Please enter a valid email.", 5000);
            return false;
        }

        // Check the password is valid
        if ($("#password-input").val().length < 6 || (!signin && $("#confirm-password-input").val().length < 6)) {
            showAlert("danger", errorTitle, "Passwords must be of 6 or more characters in length.", 5000);
            return false;
        }

        // Check the passwords match (if signing up)
        if (!signin && !passwordsMatch()) {
            showAlert("danger", errorTitle, "Please ensure passwords match.", 5000);
            return false;
        }

        return true;
    }

    // Check if the password input matches the confirm password input
    function passwordsMatch() {
        return $("#password-input").val() == $("#confirm-password-input").val();
    }

    let alertId = 0;

    // Show a bootstrap alert
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

    // Clear all bootstrap alerts
    function clearAlerts() {
        $("#alerts *").remove();
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
