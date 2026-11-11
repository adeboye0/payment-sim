"use strict";

const paymentHelper = require("../lib/payment-helper");

exports.createPayment = async (req, res, next) => {
  try {
    await paymentHelper.createPayment(res, req.body || {}, req.user);
  } catch (err) {
    next(err);
  }
};

exports.getPayment = async (req, res, next) => {
  try {
    await paymentHelper.getPayment(res, req.params.idOrReference);
  } catch (err) {
    next(err);
  }
};

exports.updatePayment = async (req, res, next) => {
  try {
    await paymentHelper.updatePayment(res, req.params.idOrReference, req.body || {});
  } catch (err) {
    next(err);
  }
};
