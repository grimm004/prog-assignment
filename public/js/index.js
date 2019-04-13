/* eslint-env browser */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-env browser */
/* global firebase isNullOrWhiteSpace */
"use strict";

firebase.initializeApp({
    apiKey: "AIzaSyCLctcnsWjexbgluwuyb6frIxAglkYGtOk",
    authDomain: "prognodechat.firebaseapp.com",
    databaseURL: "https://prognodechat.firebaseio.com",
    projectId: "prognodechat",
    storageBucket: "prognodechat.appspot.com",
    messagingSenderId: "1057913300504"
});

$(() => {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            showChatWindow();
            // Update user profile in database
            firebase.database().ref(`user/${user.uid}`)
                .update({
                    email: user.email,
                    lastSeen: Date.now(),
                });
            firebase.database().ref(`user/${user.uid}/contactRequests`).on("value", snapshot => updateContactRequestList(snapshot));
            firebase.database().ref(`user/${user.uid}/contacts`).on("value", snapshot => updateContactsList(snapshot.val()));
            firebase.auth().currentUser.getIdToken(true)
                .then(
                    idToken => {
                        // Connect to chat
                        // POST request handlers
                        $("#add-contact-form").submit(
                            event => {
                                event.preventDefault();

                                var email = $("#contact-email-input").val();
                                if (validEmail(email))
                                    fetch("/addcontact", {
                                        method: "POST",
                                        headers: {
                                            "Accept": "application/json, text/plain, */*",
                                            "Content-Type": "application/json"
                                        },
                                        body: JSON.stringify({ idToken: idToken, contact: email }),
                                    })
                                        .then(function (res) { return res.json(); })
                                        .then(function (data) { console.log(data); });
                                else
                                    console.log("Invalid email");
                            }
                        );
                    }
                ).catch(
                    error => {
                        console.log("Error occurred while accessing login token: " + error);
                    }
                );

            $("#profile-email-input").val(user.email);
            firebase.database().ref(`user/${user.uid}/displayName`).on("value", snapshot => $("#profile-display-name-input").val(snapshot.val() || ""));

            $("#profile-update-form").submit(
                e => {
                    e.preventDefault();

                    firebase.database().ref(`user/${user.uid}/`).update({
                        displayName: $("#profile-display-name-input").val(),
                    })
                        .then(() => $("#profile-update-feedback").html("<p class=\"text-success\">Successfully updated profile.</p>"))
                        .catch(() => $("#profile-update-feedback").html("<p class=\"text=danger\">Error updating profile.</p>"));
                }
            );
        } else {
            showSigninWindow();
        }
    });

    showSigninWindow();

    function showSigninWindow() {
        $("#chat-window").hide();
        $("#signin-window").show();
    }

    function showChatWindow() {
        $("#signin-window").hide();
        $("#chat-window").show();
    }

    function updateContactsList(contactList) {
        if (contactList)
            console.log(contactList);
        else
            console.log("No contacts.");
    }

    function updateContactRequestList(contactRequestSnapshot) {
        if (contactRequestSnapshot.val() == null) $("#contact-requests").html("<div class=\"text-center pt-2\">No incoming contact requests.</div>");
        else {
            $("#contact-requests").html("");
            contactRequestSnapshot.forEach(
                contactRequest => {
                    console.log(contactRequest);
                    $("#contact-requests").append(
                        `<div name="${contactRequest.val()}" class="row p-1">
                             <div class="col">
                                 <div class="d-inline">${contactRequest.val()}</div>
                                 <div class="btn-group float-right" role="group">
                                     <button class="btn btn-success btn-sm" name="a-${contactRequest.val()}">Accept</button>
                                     <button class="btn btn-danger btn-sm" name="d-${contactRequest.val()}">Decline</button>
                                 </div>
                             </div>
                         </div>`
                    );
                }
            );
        }
    }

    initLogin();
    initChat();
});

function initChat() {
    // Handle automatic scrolling
    $("#chat-history").scroll(function () { autoScroll = $(this).scrollTop() + $(this).height() >= this.scrollHeight - 1; });
    $("#signout-button").click(() => firebase.auth().signOut());

    $("div#contacts-list > div").click(function () { chatWithContact($(this).attr("name")); });

    function chatWithContact(contactId) {
        $("div#contacts-list > div").removeClass("selected-contact");
        $(`div#contacts-list > div[name="${contactId}"]`).addClass("selected-contact");
    }

    var autoScroll = true;
    function updateScroll() {
        if (autoScroll)
            scrollToBottom();
    }

    function scrollToBottom() {
        $("#chat-history").scrollTop($("#chat-history")[0].scrollHeight);
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

    // Handle sending of messages
    $("#message-form").submit(
        e => {
            e.preventDefault();

            var message = $("#message-input").val();
            if (!isNullOrWhiteSpace(message)) {
                $("#message-input").val("");
                sendMessage(message);
                outputMessage("outgoing", message);
            }
        }
    );

    function sendMessage() {

    }

    outputMessage("incoming", "Hello there");
    outputMessage("outgoing", "Hi");
    outputMessage("incoming", "Nice");
    outputMessage("outgoing", "Nice");

    function outputMessage(type, message) {
        $("#chat-history-column").append(`<div class="message"><div class="${type}">${message}</div></div>`);
        if (type == "outgoing") scrollToBottom();
        else updateScroll();
    }
}

function initLogin() {
    var signin = true;
    $("#switch-button").click(() => {
        if (signin) showSignup();
        else showSignin();
    });

    function showSignup() {
        signin = false;
        $("#confirm-password-input").show();
        $("#switch-button").html("Sign in");
        $("#submit-button").html("Sign up");
        $("#title").html("Sign up");
    }

    function showSignin() {
        signin = true;
        $("#confirm-password-input").val("");
        $("#confirm-password-input").hide();
        $("#switch-button").html("Sign up");
        $("#submit-button").html("Sign in");
        $("#title").html("Sign in");
    }

    function clearSignin() {
        $("#email-input").val("");
        $("#password-input").val("");
        $("#confirm-password-input").val("");
    }

    $("#signin-signup-form").submit(function (event) {
        event.preventDefault();

        if (dataValidation())
            if (signin)
                firebase.auth().signInWithEmailAndPassword($("#email-input").val(), $("#password-input").val())
                    .then(resetSignin)
                    .catch(
                        error => {
                            if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found")
                                showAlert("danger", "Error Signing In", "Invalid email or password.", 5000);
                            else showAlert("danger", "Error Signing In", error.message, 5000);
                        }
                    );
            else
                firebase.auth().createUserWithEmailAndPassword($("#email-input").val(), $("#password-input").val())
                    .then(resetSignin)
                    .catch(
                        error => {
                            if (error.code == "auth/weak-password")
                                showAlert("danger", "Error Signing In", "Password is too weak.", 5000);
                            else showAlert("danger", "Error Signing In", error.message, 5000);
                        }
                    );
    });

    function resetSignin() {
        showSignin();
        clearSignin();
        clearAlerts();
    }

    function dataValidation() {
        var errorTitle = signin ? "Error Signing In" : "Error Signing Up";
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

function post(location, object) {
    return fetch(location, { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(object) });
}

function isNullOrWhiteSpace(str) {
    return str === null || /^\s*$/.test(str);
}

/* https://stackoverflow.com/questions/14441456/how-to-detect-which-device-view-youre-on-using-twitter-bootstrap-api */
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

// Email validation regex from https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function validEmail(email) {
    return /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i.test(String(email).toLowerCase());
}
