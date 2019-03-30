"use strict";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("logoutButton").addEventListener("click", (event) => {
        logout();
    });

    fetchStatus();
});

function fetchStatus() {
    fetch("/status", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({  }) })
    .then(response => 
        response.json().then(function(data) {
            if (data.loggedIn) {
                console.log("Logged in");
            } else {
                window.location.replace("/login");
            }
        }));
}

function logout() {
    fetch("/logout", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({  }) })
    .then(response => 
        response.json().then(function(data) {
            fetchStatus();
        }));
}
