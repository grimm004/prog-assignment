"use strict";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("registerButton").addEventListener("click", (event) => {
        let emailInput = document.getElementById("emailInput");
        let passwordInput = document.getElementById("passwordInput");
        let confirmPasswordInput = document.getElementById("confirmPasswordInput");
        
        if (emailInput.value != "" && passwordInput.value != "") {
            if (passwordInput.value == confirmPasswordInput.value) {
                let email = emailInput.value;
                let password = passwordInput.value;
                
                usernameInput.value = "";
                passwordInput.value = "";
    
                fetch("/register", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, password: password }) })
                    .then(response => console.log("Response..."));
            } else {
                $('.alert').alert();
            }
        }
    });
});
