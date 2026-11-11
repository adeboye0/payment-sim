"use strict";

require("dotenv").config();

const { createApp } = require("./app");
const { start } = require("./jobs/resolve-pending");
const { port } = require("./config");

const app = createApp();
start();

app.listen(port, "0.0.0.0", () => {
  console.log(`listening on :${port}`);
});
