"use strict";

const authHelper = require("../lib/auth-helper");

exports.login = async (req, res, next) => {
  try {
    await authHelper.login(res, req.body || {});
  } catch (err) {
    next(err);
  }
};
