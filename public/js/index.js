"use strict";

$(() => {
    $("#logoutButton").click(() => logout(() => window.location.replace("/login")));
    $("#submitButton").click(submit);

    function submit() {
        sendMessage($("#messageInput").val());
    }
});

verifyLogin(loggedIn => {
    if (!loggedIn) window.location.replace("/login");
});
