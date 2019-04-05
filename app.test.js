/* eslint-env jest */
"use strict";

const app = require("./app");

test("check that 1 + 2 is 3 using the add function", () => {
    expect(app.add(1, 2)).toBe(3);
});
