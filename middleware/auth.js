"use strict";

const jwt = require("jsonwebtoken");
const config = require("../config");
const { apiResponse } = require("../utils/responses");

const requireAuth = (req, res, next) => {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";

  if (!token) return apiResponse(res, "failed", { message: "Unauthorized." }, 401);

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.sub, email: decoded.email };
    return next();
  } catch (err) {
    return apiResponse(res, "failed", { message: "Unauthorized." }, 401);
  }
};

module.exports = { requireAuth };
