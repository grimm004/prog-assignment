"use strict";

var ChatApplication = require("./app");

if (require.main === module) {
    new ChatApplication(8080).start();
}
