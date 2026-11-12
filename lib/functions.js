"use strict";

const crypto = require("crypto");
const uid = require("short-uuid");

exports.generateId = () => {
  return uid.generate();
};

exports.encrypt = (text, secret) => {
  const key = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
};

exports.decrypt = (payload, secret) => {
  const key = crypto.createHash("sha256").update(secret).digest();
  const data = Buffer.from(payload, "base64url");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return decipher.update(data.subarray(28), undefined, "utf8") + decipher.final("utf8");
};

exports.logError = (context, e) => {
  const response = e?.response;
  let details;
  try {
    details = JSON.stringify({
      message: e?.message || e?.description || String(e),
      code: e?.code,
      status: response?.status ?? e?.status,
      responseData: response?.data,
      method: e?.config?.method,
      url: e?.config?.url,
      stack: e?.stack,
    });
  } catch (err) {
    details = e?.message || String(e);
  }
  console.error(context, details);
};

exports.generatePaymentReference = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `PAY-${timestamp}-${random}`;
};
