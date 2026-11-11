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

Copy `.env.example` for the demo login (`test@example.com` / `test-password`). `PUBLIC_BASE_URL` must be the address this server is actually listening on, because checkout links and the webhook call use it.

## Flow

1. `POST /auth/login` with the demo email and password. Send the returned token as `Authorization: Bearer <token>` on the payment routes below.
2. `POST /create-payment` with `{ "amount": 25.5 }`. Currency is optional and defaults to `USD`. The response includes `checkoutUrl`.
3. Open that URL. Pay or Fail moves the payment to `processing`, then three seconds later a webhook sets it to `success` or `failed`. Cancel sets a pending payment to `abandoned`.

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

Lookup and update accept a payment id or a reference. Update takes `{ "status": "pending" }` and the status must be one of the values above.

Responses look like `{ "status": "success", "data": {} }`. Failures use `"failed"` and are usually HTTP 400.

## Webhook

Confirm and fail post `{ "payload": "<ciphertext>" }` to `/webhooks/payment`. The payload is AES-256-GCM, keyed with `sha256(WEBHOOK_SECRET)`, and the decrypted body is `{ "event": "payment.succeeded" | "payment.failed", "reference": "..." }`. A payload that cannot be decrypted returns 401.

## Other

Each night, pending payments older than 12 hours are marked `abandoned`, 100 at a time. `data/payments.json` is gitignored. Delete it to start with an empty store.
