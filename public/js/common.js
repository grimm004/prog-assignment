function post(location, object) {
    return fetch(location, { method: "POST", mode: "cors", cache: "no-cache", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(object) });
}

function isNullOrWhiteSpace(str) {
    return str === null || /^\s*$/.test(str);
}
