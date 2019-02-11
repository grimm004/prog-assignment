"use strict";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loginButton").addEventListener("click", (event) => {
        let usernameInput = document.getElementById("usernameInput");
        let passwordInput = document.getElementById("passwordInput");
        
        if (usernameInput.value != "" && passwordInput.value != "") {
            let username = usernameInput.value;
            let password = passwordInput.value;
            
            usernameInput.value = "";
            passwordInput.value = "";
            
            var request = new XMLHttpRequest();
            request.open("POST", "login", true);
            request.setRequestHeader("Content-type", "text/json");
            request.send(JSON.stringify({ username: username, password: password }));
        }
    });
});
