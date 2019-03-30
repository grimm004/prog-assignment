"use strict";

$(function() {
    $("#confirmPasswordInput").on('input', () =>
        $("#confirmPasswordInput")[0].setCustomValidity($("#passwordInput").val() == $("#confirmPasswordInput").val() ? "" : "Passwords do not match..."));

    $("#registerForm").submit(function(event) {
        event.preventDefault();

        if ($("#passwordInput").val() == $("#confirmPasswordInput").val()) {
            $("#confirmPasswordInput")[0].setCustomValidity("");

            fetch("/register", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: $("#emailInput").val(), password: $("#passwordInput").val() }) })
                .then(response =>
                    response.json().then(function(data) {
                        console.log(data);
                        if (data.registered) {
                            console.log("Registered");
            
                            $("#emailInput").val("");;
                            $("#passwordInput").val("");
                            $("#confirmPasswordInput").val("");

                            window.location.replace("/");
                        } else {
                            switch (data.errorCode) {
                                case "auth/email-already-in-use":
                                    alert("Email already in use.");
                                    break;
                                default:
                                    alert("Error registering.");
                                    break;
                            }
                        }
                    }));
        } else {
            console.log("Passwords do not match...");
        }
    });

    fetch("/status", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({  }) })
        .then(response => 
            response.json().then(function(data) {
                if (data.loggedIn) window.location.replace("/");
            }));
});
