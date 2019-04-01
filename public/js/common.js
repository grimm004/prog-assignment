var autoLogin = true;

function post(location, object) {
    return fetch(location, { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(object) });
}

function verifyLogin(action) {
    try {
        post("/status", {})
            .then(response => response.json().then((data) => action(data.loggedIn)))
            .catch(reason => console.log("Error occurred during login validation: " + reason));
        return true;
    } catch (error) {
        console.log("Error occured during login validation: " + error);
        return false;
    }
}

function login(email, password, successCallback, failureCallback) {
    try {
        post("/login", { email: email, password: password })
            .then(response =>
                response.json().then(function (data) {
                    if (data.loggedIn && successCallback) successCallback();
                    else if (!data.loggedIn && failureCallback) failureCallback(data.errorCode);
                }))
            .catch(reason => {
                console.log("Error occurred during login request: " + reason);
                if (failureCallback) failureCallback(reason);
            });
    } catch (error) {
        console.log("Error occurred during login request: " + error);
        if (failureCallback) failureCallback(error);
    }
}

function register(email, password, successCallback, failureCallback) {
    try {
        post("/register", { email: email, password: password })
            .then(response =>
                response.json().then(function (data) {
                    if (data.registered && successCallback) successCallback();
                    else if (!data.registered && failureCallback) failureCallback(data.errorCode);
                }))
            .catch(reason => {
                console.log("Error occurred during register request: " + reason);
                if (failureCallback) failureCallback(reason);
            });
    } catch (error) {
        console.log("Error occurred during register request: " + error);
        if (failureCallback) failureCallback(error);
    }
}

function logout(successCallback, failureCallback) {
    try {
        post("/logout", {})
            .then(() => {
                if (successCallback) successCallback();
            })
            .catch(reason => {
                console.log("Error occurred during logout request: " + reason);
                if (failureCallback) failureCallback(reason);
            });
    } catch (error) {
        console.log("Error occurred during logout request: " + error);
        if (failureCallback) failureCallback(error);
    }
}

function sendMessage(message) {
    
}
