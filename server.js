/* eslint-env node */
/* eslint-disable no-console */
"use strict";
const app = require("./app");
if (require.main === module)
    app.httpServer.listen(8080, () => console.log("Started server on port 8080..."));
