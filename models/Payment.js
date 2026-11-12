"use strict";

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../data", path.basename(process.env.PAYMENTS_FILE || "payments.json"));
fs.mkdirSync(path.dirname(file), { recursive: true });

const payments = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
const save = () => fs.writeFileSync(file, JSON.stringify(payments, null, 2));

module.exports = { payments, save };
