"use strict";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('emailInput').onkeydown = function(e) {
        if(e.keyCode == 13) submit();
    };
    document.getElementById('passwordInput').onkeydown = function(e) {
        if(e.keyCode == 13) submit();
    };
    document.getElementById("loginButton").addEventListener("click", (event) => {
        submit();
    });

    fetch("/status", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({  }) })
        .then(response => 
            response.json().then(function(data) {
                if (data.loggedIn) {
                    window.location.replace("/");
                }
            }));

    function submit() {
        let emailInput = document.getElementById("emailInput");
        let passwordInput = document.getElementById("passwordInput");
        
        if (emailInput.value != "" && passwordInput.value != "") {
            if (isEmailValid(emailInput.value))
            {
                let email = emailInput.value;
                let password = passwordInput.value;

                fetch("/login", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, password: password }) })
                    .then(response => 
                        response.json().then(function(data) {
                            passwordInput.value = "";
                            if (data.loggedIn) {
                                emailInput.value = "";
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
            } else {
                alert("Invalid email address...");
            }
        }
    }
});

// Email validation regular expression from https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function isEmailValid(email) {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(String(email).toLowerCase());
}
