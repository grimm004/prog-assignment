/* eslint-env jest */
"use strict";

const request = require("supertest");
const app = require("./app");
const admin = require("./firebase-manager")(false, app.io);
app.initialiseApp(admin);

describe("Test the static files", () => {
    test("GET /", () => {
        return request(app.expressApp)
            .get("/")
            .expect(200);
    });

    test("GET /index.html", () => {
        return request(app.expressApp)
            .get("/index.html")
            .expect(200);
    });

    test("GET /firebase/firebase-app.js", () => {
        return request(app.expressApp)
            .get("/firebase/firebase-app.js")
            .expect(200);
    });

    test("GET /firebase/firebase-auth.js", () => {
        return request(app.expressApp)
            .get("/firebase/firebase-auth.js")
            .expect(200);
    });

    test("GET /firebase/firebase-database.js", () => {
        return request(app.expressApp)
            .get("/firebase/firebase-database.js")
            .expect(200);
    });
    
    test("GET /js/index.js", () => {
        return request(app.expressApp)
            .get("/js/index.js")
            .expect(200);
    });
    
    test("GET /css/styles.css", () => {
        return request(app.expressApp)
            .get("/css/styles.css")
            .expect(200);
    });
    
    test("GET /favicon.ico", () => {
        return request(app.expressApp)
            .get("/favicon.ico")
            .expect(200);
    });
});
