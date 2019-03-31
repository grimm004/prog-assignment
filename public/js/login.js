"use strict";

$(function () {
    $("#loginForm").submit(function (event) {
        event.preventDefault();

        fetch("/login", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: $("#emailInput").val(), password: $("#passwordInput").val() }) })
            .then(response =>
                response.json().then(function (data) {
                    $("#passwordInput").val("");
                    if (data.loggedIn) {
                        $("#emailInput").val("");
                        window.location.replace("/");
                    } else {
                        switch (data.errorCode) {
                            case "auth/user-not-found":
                                alert("Account not found.");
                                break;
                            case "auth/wrong-password":
                                alert("Invalid password.");
                                break;
                            default:
                                alert("Error logging in.");
                                break;
                        }
                    }
                }));
    });

    fetch("/status", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
        .then(response =>
            response.json().then(function (data) {
                if (data.loggedIn) window.location.replace("/");
            }));
});
