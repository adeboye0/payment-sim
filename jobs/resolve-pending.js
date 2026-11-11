"use strict";

const cron = require("node-cron");
const _ = require("lodash");
const moment = require("moment");
const { payments, save } = require("../models/Payment");

function resolvePending() {
  const cutoff = moment().subtract(12, "hours");
  const stalePayments = _.filter(payments, (item) => item.status === "pending" && moment(item.createdAt).isBefore(cutoff));
  if (!stalePayments.length) {
    console.log("No pending payments to resolve");
    return 0;
  }

  _.chunk(stalePayments, 100).forEach((batch) => {
    const updatedAt = moment().toISOString();
    batch.forEach((item) => {
      item.status = "abandoned";
      item.updatedAt = updatedAt;
    });
    save();
    console.log(`${batch.length} payments updated`);
  });

  return stalePayments.length;
}

function start() {
  cron.schedule("0 0 * * *", resolvePending);
}

module.exports = { start, resolvePending };
