# payment-sim

Express service that simulates a payment. You create one, open a local pay page, and the server settles it with an encrypted webhook. Payments are saved in `data/payments.json`.

Requires Node.js 20 or newer.

## Setup

```bash
npm install
cp .env.example .env
npm start
```

`npm run dev:server` restarts on file changes. The server listens on port `3000` unless `PORT` is set.

Copy `.env.example` for the demo logins (`test@example.com` and `test2@example.com`, both `test-password`). `PUBLIC_BASE_URL` must be the address this server is actually listening on, because checkout links and the webhook call use it.

## Flow

1. `POST /auth/login` with the demo email and password. Send the returned token as `Authorization: Bearer <token>` on the payment routes below.
2. `POST /create-payment` with `{ "amount": 25.5 }`. Currency is optional and defaults to `USD`. The response includes `checkoutUrl`.
3. Open that URL. Pay or Fail moves the payment to `processing`, then five seconds later a webhook sets it to `success` or `failed`. Cancel sets a pending payment to `abandoned`.

The same user cannot create the same amount again within 3 minutes. A payment that is already `processing` cannot be cancelled.

Statuses: `pending`, `processing`, `success`, `failed`, `abandoned`.

## Routes

| Method | Path | Auth |
| --- | --- | --- |
| `POST` | `/auth/login` | No |
| `POST` | `/create-payment` | Yes |
| `GET` | `/get-payment/:idOrReference` | Yes |
| `PUT`, `PATCH` | `/update-payment/:idOrReference` | Yes |
| `GET` | `/pay/:reference` | No |
| `GET` | `/pay/:reference/status` | No |
| `POST` | `/pay/:reference/confirm` | No |
| `POST` | `/pay/:reference/fail` | No |
| `POST` | `/pay/:reference/cancel` | No |
| `POST` | `/webhooks/payment` | No |

Get and update accept either the payment id or the reference, and only return a payment created by the signed-in user. Update sends `{ "status": "success" }`, using one of the statuses above.

A response is `{ "status": "success", "data": {} }` or `{ "status": "failed", "data": {} }`. Failed requests are HTTP 400 unless the route returns another code, such as 401 or 404.

## Webhook

Five seconds after Pay or Fail, the server posts an encrypted payload to `/webhooks/payment`. Once decrypted, the body is `{ "event": "payment.succeeded" | "payment.failed", "reference": "PAY-..." }`. A payload that cannot be decrypted returns 401.

## Store

Each night, pending payments older than 12 hours become `abandoned`. Delete the file `data/payments.json` to start with an empty store.
