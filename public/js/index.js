"use strict";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loggedIn").innerHTML = "...";

    fetch("/status", { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({  }) })
        .then(response => 
            response.json().then(function(data) {
                if (data.loggedIn) {
                    console.log("Logged in");
                    
                    document.getElementById("loggedIn").innerHTML = "Logged in";

                } else {
                    window.location.replace("/login");
                }
            }));
});
