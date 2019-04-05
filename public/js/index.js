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
            $("#profile-email-input").val(user.email);
            $("#profile-display-name-input").val(user.displayName);
            showChatWindow();
        } else {
            showSigninWindow();
        }
    });

    $("#profile-update-form").submit(
        e => {
            e.preventDefault();

            firebase.auth().currentUser.updateProfile({ displayName: $("#profile-display-name-input").val() })
                .then(() => $("#profile-update-feedback").html("<p class=\"text-success\">Successfully updated profile.</p>"))
                .catch(() => $("#profile-update-feedback").html("<p class=\"text=danger\">Error updating profile.</p>"));
        }
    );

    showSigninWindow();

    function showSigninWindow() {
        $("#chat-window").hide();
        $("#signin-window").show();
    }

    function showChatWindow() {
        $("#signin-window").hide();
        $("#chat-window").show();
    }

    initLogin();
    initChat();
});

function initChat() {
    // Handle automatic scrolling
    $("#chat-history").scroll(() => autoScroll = $("#chat-history").scrollTop() + $("#chat-history").height() >= $("#chat-history")[0].scrollHeight - 1);
    $("#signout-button").click(() => firebase.auth().signOut());

    var autoScroll = true;
    function updateScroll() {
        if (autoScroll)
            scrollToBottom();
    }

    function scrollToBottom() {
        $("#chat-history").scrollTop($("#chat-history")[0].scrollHeight);
    }

    scrollToBottom();

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
                    .then(
                        () => {
                            showSignin();
                            clearSignin();
                            clearAlerts();
                        }
                    )
                    .catch(
                        error => {
                            if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found")
                                showAlert("danger", "Error Signing In", "Invalid email or password.", 5000);
                            else showAlert("danger", "Error Signing In", error.message, 5000);
                        }
                    );
            else
                firebase.auth().createUserWithEmailAndPassword($("#email-input").val(), $("#password-input").val())
                    .then(
                        () => {
                            showSignin();
                            clearSignin();
                            clearAlerts();
                        }
                    )
                    .catch(
                        error => {
                            if (error.code == "auth/weak-password")
                                showAlert("danger", "Error Signing In", "Password is too weak.", 5000);
                            else showAlert("danger", "Error Signing In", error.message, 5000);
                        }
                    );
    });

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

    // Email validation regex from https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
    function validEmail(email) {
        return /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i.test(String(email).toLowerCase());
    }

    var alertId = 0;
    function showAlert(type, title, message, timeout) {
        $("#alerts").append(`
        <div name="alert-${alertId}" class="alert alert-${type} alert-dismissible fade show">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            <strong>${title}</strong> ${message}
        </div>
        `);
        $(`#alerts [name*='alert-${alertId}']`).on("closed.bs.alert",
            (() => {
                var currentAlertId = alertId;
                return () => $(`#alerts [name*='alert-${currentAlertId}']`).remove();
            })());
        if (timeout)
            setTimeout(
                (() => {
                    var currentAlertId = alertId;
                    return () => $(`#alerts div[name*='alert-${currentAlertId}']`).alert("close");
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
