"use strict";

const fs = require("fs");
const path = require("path");
const { payments, save } = require("../models/Payment");

const file = path.join(__dirname, "../data/payments.test.json");

beforeAll(() => {
  payments.splice(0, payments.length);
  save();
});

afterAll(() => {
  payments.splice(0, payments.length);
  fs.rmSync(file, { force: true });
});
