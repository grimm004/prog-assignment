/* eslint-env node */
/* eslint-disable no-console */
"use strict";

const onlineFirebase = false;

const app = require("./app");
const admin = require("./firebase-manager")(onlineFirebase, app.socketIOApp);

if (require.main === module) {
    app.initialiseApp(admin);
    app.httpServer.listen(8080, () => console.log("Started server on port 8080..."));
}
