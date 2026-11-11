"use strict";

require("dotenv").config();

const { createApp } = require("./app");

const PORT = Number(process.env.PORT || 8080);
const app = createApp();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`payment-sim listening on :${PORT}`);
});
