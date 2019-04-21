/* eslint-env node */
"use strict";

try {
    module.exports = {
        credentialData: require("./adminkey.json"),
        databaseURL: ""
    };
} catch (error) {
    module.exports = null;
}
