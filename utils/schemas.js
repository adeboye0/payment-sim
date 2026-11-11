"use strict";

const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const compiled = new WeakMap();

const loginSchema = {
  type: "object",
  additionalProperties: false,
  required: ["email", "password"],
  properties: {
    email: { type: "string", format: "email", minLength: 3, maxLength: 254 },
    password: { type: "string", minLength: 1, maxLength: 128 },
  },
};

const createPaymentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["amount"],
  properties: {
    amount: { type: "number", exclusiveMinimum: 0 },
    currency: { type: "string", enum: ["USD"] }
  },
};

const updatePaymentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["status"],
  properties: {
    status: { type: "string", enum: ["pending", "success", "failed", "abandoned"] },
  },
};

function validateSchema(paramObj, schema) {
  let validate = compiled.get(schema);
  if (!validate) {
    validate = ajv.compile(schema);
    compiled.set(schema, validate);
  }

  if (validate(paramObj)) return { status: true };

  const err = validate.errors[0];
  const field = err.instancePath ? err.instancePath.replace(/^\//, "") : "(root)";
  let message;

  switch (err.keyword) {
    case "required":
      message = `${err.params.missingProperty} is required.`;
      break;
    case "type":
      message = `${field} must be of type ${err.params.type}.`;
      break;
    case "minLength":
      message = `${field} must have at least ${err.params.limit} characters.`;
      break;
    case "maxLength":
      message = `${field} must have at most ${err.params.limit} characters.`;
      break;
    case "pattern":
    case "format":
      message = `${field} format is invalid.`;
      break;
    case "minimum":
    case "exclusiveMinimum":
      message = `${field} must be > ${err.params.limit}.`;
      break;
    case "maximum":
    case "exclusiveMaximum":
      message = `${field} must be <= ${err.params.limit}.`;
      break;
    case "enum":
      message = `${field} must be one of: ${err.params.allowedValues.join(", ")}.`;
      break;
    case "additionalProperties":
      message = `${err.params.additionalProperty} is not allowed.`;
      break;
    default:
      message = `${field} ${err.message}`;
  }

  return { status: false, message };
}

module.exports = {
  loginSchema,
  createPaymentSchema,
  updatePaymentSchema,
  validateSchema,
};
