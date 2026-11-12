"use strict";

const jwt = require("jsonwebtoken");
const _ = require("lodash");
const config = require("../config");
const schemas = require("../utils/schemas");
const { apiResponse } = require("../utils/responses");

exports.login = async (res, body = {}) => {
  const valid = schemas.validateSchema(body, schemas.loginSchema);
  if (!valid.status) return apiResponse(res, "failed", { message: valid.message });

  const { password } = body;
  const email = body.email.trim().toLowerCase();

  const user = _.find(config.demoUsers, (item) => item.email === email && item.password === password);
  if (!user) {
    return apiResponse(res, "failed", { message: "Invalid email or password" }, 401);
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return apiResponse(res, "success", {
    token,
    expiresIn: config.jwtExpiresIn,
    user: { id: user.id, email: user.email },
  });
};
