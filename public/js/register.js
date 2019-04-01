"use strict";

$(function () {
    $("#confirmPasswordInput").on('input', () =>
        $("#confirmPasswordInput")[0].setCustomValidity($("#passwordInput").val() == $("#confirmPasswordInput").val() ? "" : "Passwords do not match..."));

    $("#registerForm").submit(function (event) {
        event.preventDefault();
        register($("#emailInput").val(), $("#passwordInput").val(),
            () => window.location.replace("/"),
            errorCode => {
                switch (errorCode) {
                    case "auth/email-already-in-use":
                        console.log("Email already in use.");
                        showAlert("danger", "Register Failed", "Email already in use.");
                        break;
                    default:
                        console.log("Error registering: " + errorCode);
                        showAlert("danger", "Register Failed", "Error registering: " + errorCode);
                        break;
                }
            });
    });

    function showAlert(type, title, message) {
        $("div#alerts").html(`
        <div class="alert alert-${ type} alert-dismissible fade show">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            <strong>${ title}</strong> ${message}
        </div>
        `);
    }
});

verifyLogin(loggedIn => {
    if (loggedIn) window.location.replace("/");
    else if (autoLogin) window.location.replace("/login");
});
