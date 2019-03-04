"use strict";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('emailInput').onkeydown = function(e) {
        if(e.keyCode == 13) submit();
    };
    document.getElementById('passwordInput').onkeydown = function(e) {
        if(e.keyCode == 13) submit();
    };
    document.getElementById('confirmPasswordInput').onkeydown = function(e) {
        if(e.keyCode == 13) submit();
    };
    document.getElementById("registerButton").addEventListener("click", (event) => {
        submit();
    });

    function submit() {
        let emailInput = document.getElementById("emailInput");
        let passwordInput = document.getElementById("passwordInput");
        let confirmPasswordInput = document.getElementById("confirmPasswordInput");

        if (emailInput.value != "" && passwordInput.value != "") {
            if (passwordInput.value == confirmPasswordInput.value) {
                if (isEmailValid(emailInput.value))
                {
                    let email = emailInput.value;
                    let password = passwordInput.value;

                    fetch("/register", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, password: password }) })
                        .then(response =>
                            response.json().then(function(data) {
                                if (data.loggedIn) {
                                    console.log("Registered");
                    
                                    emailInput.value = "";
                                    passwordInput.value = "";
                                    confirmPasswordInput.value = "";

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
                    alert("Invalid email entered...");
                }
            } else {
                alert("Passwords do not match...");
            }
        }
    }
});

// Email validation regular expression from https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function isEmailValid(email) {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(String(email).toLowerCase());
}
