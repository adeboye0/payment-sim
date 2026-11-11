"use strict";

function apiResponse(res, status, data, code) {
  const statusCode = code || (status === "success" ? 200 : 400);
  return res.status(statusCode).json({ status, data });
}

module.exports = { apiResponse };
