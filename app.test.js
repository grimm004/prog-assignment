/* eslint-env jest */
"use strict";

const ChatApplication = require("./app");
const port = 8080;
const chatApplication = new ChatApplication(port);
//const app = chatApplication.Express;
//const io = chatApplication.SocketIO;

test("check the internal port is the same as that provided", () => {
    expect(chatApplication.Port).toBe(port);
});
