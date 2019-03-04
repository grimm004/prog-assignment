"use strict";

$('.alert').alert();

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("registerButton").addEventListener("click", (event) => {
        let emailInput = document.getElementById("emailInput");
        let passwordInput = document.getElementById("passwordInput");
        let confirmPasswordInput = document.getElementById("confirmPasswordInput");

        if (emailInput.value != "" && passwordInput.value != "") {
            if (passwordInput.value == confirmPasswordInput.value) {
                if (isEmailValid(emailInput.value))
                {
                    let email = emailInput.value;
                    let password = passwordInput.value;
    
                    emailInput.value = "";
                    passwordInput.value = "";
                    confirmPasswordInput.value = "";

                    fetch("/register", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, password: password }) })
                        .then(response => console.log("Response..."));
                } else {
                    alert("Invalid email entered...");
                }
            } else {
                alert("Passwords do not match...");
            }
        }
    });
});

// Email validation regular expression from https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function isEmailValid(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
