"use strict";

const moment = require("moment");
const { payments, save } = require("../models/Payment");
const { resolvePending } = require("../jobs/resolve-pending");

describe("resolvePending", () => {

  test("abandons pending payments older than 12 hours", () => {
    const snapshot = payments.splice(0, payments.length);

    try {
      const staleAt = moment().subtract(13, "hours").toISOString();
      const newAt = moment().subtract(2, "hours").toISOString();
      payments.push({ id: "stale", status: "pending", createdAt: staleAt });
      payments.push({ id: "new", status: "pending", createdAt: newAt });
      payments.push({ id: "paid", status: "success", createdAt: staleAt });

      expect(resolvePending()).toBe(1);
      expect(payments.find((item) => item.id === "stale").status).toBe("abandoned");
      expect(payments.find((item) => item.id === "new").status).toBe("pending");
      expect(payments.find((item) => item.id === "paid").status).toBe("success");
    } finally {
      payments.splice(0, payments.length, ...snapshot);
      save();
    }
  });

  test("does nothing when no pending payment is older than 12 hours", () => {
    const snapshot = payments.splice(0, payments.length);

    try {
      payments.push({ id: "new", status: "pending", createdAt: moment().toISOString() });
      expect(resolvePending()).toBe(0);
      expect(payments[0].status).toBe("pending");
    } finally {
      payments.splice(0, payments.length, ...snapshot);
      save();
    }
  });
});
