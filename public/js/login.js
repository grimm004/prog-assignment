"use strict";

$(function () {
    $("#loginForm").submit(function (event) {
        event.preventDefault();
        login($("#emailInput").val(), $("#passwordInput").val(),
            () => window.location.replace("/"),
            errorCode => {
                switch (errorCode) {
                    case "auth/user-not-found":
                    case "auth/wrong-password":
                        console.log("Invalid password.");
                        showAlert("danger", "Login Failed", "Invalid email or password.");
                        break;
                    case "auth/too-many-requests":
                        console.log("Too many requests.");
                        showAlert("danger", "Login Failed", "Too many requests.");
                        break;
                    default:
                        console.log("Error logging in: " + errorCode);
                        showAlert("danger", "Login Failed", "Error logging in: " + errorCode);
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
        setTimeout(() => $("div#alerts").html(""), 5000)
    }
});

verifyLogin(loggedIn => {
    if (loggedIn) window.location.replace("/");
    else if (autoLogin) login("test@test.test", "testtest", () => window.location.replace("/"));
});
