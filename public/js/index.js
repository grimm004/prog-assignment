/* eslint-env browser */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-env browser */
/* global firebase isNullOrWhiteSpace */
"use strict";

$(() => {
    initLogin();
    initChat();
});

firebase.initializeApp({
    apiKey: "AIzaSyCLctcnsWjexbgluwuyb6frIxAglkYGtOk",
    authDomain: "prognodechat.firebaseapp.com",
    databaseURL: "https://prognodechat.firebaseio.com",
    projectId: "prognodechat",
    storageBucket: "prognodechat.appspot.com",
    messagingSenderId: "1057913300504"
});

function initChat() {
    // Handle automatic scrolling
    $("#chat-history").scroll(() => autoScroll = $("#chat-history").scrollTop() + $("#chat-history").height() >= $("#chat-history")[0].scrollHeight - 1);

    var autoScroll = true;
    function updateScroll() {
        if (autoScroll)
            scrollToBottom();
    }

    function scrollToBottom() {
        $("#chat-history").scrollTop($("#chat-history")[0].scrollHeight);
    }

    scrollToBottom();

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
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            var displayName = user.displayName;
            var email = user.email;
            var emailVerified = user.emailVerified;
            var photoURL = user.photoURL;
            var isAnonymous = user.isAnonymous;
            var uid = user.uid;
            var providerData = user.providerData;
        }
    });

    var signin = true;
    $("#switch-button").click(() => {
        if (signin) showSignup();
        else showSignin();
    });

    function showSignup() {
        signin = false;
        $("#confirm-password-input").attr("disabled", false);
        $("#confirm-password-input").show();
        $("#switch-button").html("Sign in");
        $("#submit-button").html("Sign up");
        $("#title").html("Sign up");
    }

    function showSignin() {
        signin = true;
        $("#confirm-password-input")[0].setCustomValidity("");
        $("#confirm-password-input").val("");
        $("#confirm-password-input").hide();
        $("#confirm-password-input").attr("disabled", true);
        $("#switch-button").html("Sign up");
        $("#submit-button").html("Sign in");
        $("#title").html("Sign in");
    }

    $("#signin-signup-form").submit(function (event) {
        event.preventDefault();

        if (dataValidation())
            if (signin)
                firebase.auth().signInWithEmailAndPassword($("#email-input").val(), $("#password-input").val())
                    .catch(
                        error => {
                            if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
                                showAlert("danger", "Error Signing In", "Invalid email or password.", 5000);
                            } else showAlert("danger", "Error Signing In", error.message, 5000);
                        }
                    );
            else {
                //
            }
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
}

function post(location, object) {
    return fetch(location, { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(object) });
}

function isNullOrWhiteSpace(str) {
    return str === null || /^\s*$/.test(str);
}
