"use strict";

const uid = require("short-uuid");

exports.generateId = () => {
  return uid.generate();
};

exports.toCent = (amount) => {
  return Math.round(Number(amount) * 100);
};

exports.generatePaymentReference = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `PAY-${timestamp}-${random}`;
};
