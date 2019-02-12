"use strict";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loginButton").addEventListener("click", (event) => {
        let emailInput = document.getElementById("emailInput");
        let passwordInput = document.getElementById("passwordInput");
        
        if (emailInput.value != "" && passwordInput.value != "") {
            let email = uemailInput.value;
            let password = passwordInput.value;
            
            emailInput.value = "";
            passwordInput.value = "";

            fetch("/login", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, password: password }) })
                .then(response => console.log("Response..."));
        }
    });
});
