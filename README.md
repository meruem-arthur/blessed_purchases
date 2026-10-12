# Student Payment Portal

A single-system payment portal. Students visit the root URL (`/`) to choose purchasable items and pay. There are no student-facing slugs, department pages, academic sessions, student levels, CSV student imports, or dues-clearance workflows.

## Routes

- `/` — public student checkout (main domain, no slug)
- `/payment-status` — payment-return information
- `/admin/login` — the single administrator sign-in page
- `/admin` — payment dashboard; Super Admin accounts also see system-wide provider settings
- `/api/payments/initiate` — validates checkout selections server-side and initializes a provider transaction
- `/api/payments/status` — payment-status polling; `/api/receipts/download?ref=…` — PDF receipt for a confirmed payment
- `/api/products` — public list of items currently on sale (read by the checkout page)
- `/api/admin/products` — Super Admin-only: add, rename, re-price, hide/show and delete items (`/api/admin/products/[id]`)
- `/api/admin/receipt-settings` — Super Admin-only CEO name and signature image printed on PDF receipts
- `/api/admin/sms-settings` — Super Admin-only SMS provider, API key, sender ID and message template
- `/api/admin/email-settings` — Super Admin-only email provider (Brevo), API key, sender name/address, subject and message
- `/api/admin/notifications` — failed SMS/email sends for the admin Delivery log; `POST /api/admin/notifications/[id]/resolve` marks one fixed
- `/api/webhooks/paystack` — verifies Paystack signatures and independently verifies successful transactions before issuing a receipt
- `/api/admin/payments` — authenticated payment records and dashboard totals
- `/api/admin/settings` — Super Admin-only global payment-provider configuration
- `/api/admin-users` — Super Admin-only administrator account management

The login credentials determine the user's role (`SUPER_ADMIN` or `ADMIN`). Admins use the same login URL; authorization is enforced server-side.

## Requirements

- Node.js 20+
- PostgreSQL
- Paystack account for hosted checkout (Paystack is the configured and verified provider in this version)

## Configure and run

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`, `NEXT_PUBLIC_APP_URL`, and the initial Super Admin credentials (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`, optionally `ADMIN_EMAIL` / `ADMIN_PASSWORD`). Optionally set the `NEXT_PUBLIC_ORG_*` variables to print your organisation name, enquiry line and website on the pages and receipts (see `src/lib/branding.ts`). Generate keys with `openssl rand -base64 32`.
2. Install dependencies: `npm ci`.
3. Apply database migrations: `npx prisma migrate deploy`.
4. Generate Prisma Client: `npx prisma generate`.
5. Seed the initial administrator and singleton payment configuration: `npm run prisma:seed`.
6. Start locally: `npm run dev`; for production: `npm run build` then `npm start`.
7. Sign in at `/admin/login` (no link on the public page - go to the URL directly). A Super Admin sets the Paystack keys under Payment settings and the SMS provider, API key and sender ID under SMS settings. Email receipts are set up under Email settings (see below). Items & prices are under **Items & prices**. The President/Treasurer signatories for receipts and the portal QR code are under Receipts & QR (Super Admin only).

Never commit `.env` or real payment-provider secrets. Provider secret and webhook keys are encrypted at rest using `ENCRYPTION_KEY`; do not change that key after saving credentials unless you first decrypt/re-encrypt the stored secrets.

## Email receipts (Brevo)

After a successful payment each student is emailed their receipt with the PDF attached, alongside the SMS. It is configured entirely in **Admin > Email settings** (Super Admin only); there are no new environment variables. The API key is encrypted with `ENCRYPTION_KEY`, like the SMS key. Email goes over Brevo's HTTPS API, so it works on Vercel (SMTP does not).

One-time Brevo setup:

1. Create a Brevo account and an API key (SMTP & API > API keys).
2. Verify your sending domain in Brevo (Senders, Domains & Dedicated IPs > Domains). Brevo lists the DNS records (a verification TXT, DKIM, and optionally DMARC); add them at your DNS host (for Cloudflare, set CNAME records to *DNS only*). The sender address must be on this domain, e.g. `receipts@your-domain`, or mail goes to spam or is rejected.
3. **Turn off IP blocking** in Brevo (Security > Authorised IPs). Vercel's outbound IP addresses change, so with blocking on Brevo rejects every send. The Delivery log shows a hint if this happens.
4. In Email settings: choose Brevo, paste the key, set sender name and address, tick *Send email receipts*, save.

Students with no email on file (registered before email became required) are skipped. A failed email never affects the payment or receipt; it is recorded in the **Delivery log** tab (all admins), where it can be marked fixed. Brevo's free plan has a daily send cap; check your plan against expected volume.

## Database

The project ships a single initial migration (`20261009000000_init`) that creates the whole single-system schema. For a fresh or wiped database run `npx prisma migrate deploy` (or `npx prisma migrate reset --force` to wipe an existing development database first), then `npm run prisma:seed`. Back up production data before running any migration.

## Important operational notes

- Payment amounts and product IDs are validated server-side; never trust a client-submitted amount.
- A payment is not considered successful based on the browser redirect. The webhook validates the signature and verifies the transaction with Paystack before marking it successful.
- Configure Paystack's webhook URL as `https://YOUR_DOMAIN/api/webhooks/paystack`.
- Items and prices are stored in the database and managed by a Super Admin under **Admin > Items & prices**. The server prices every order from the database, so the browser can never set an amount. Each payment keeps a copy of the item names and prices it was bought at, so editing or deleting an item never changes an old receipt. The migration starts you with Geo Tools (GHS 650), Compass only (GHS 300) and 50m Tape (GHS 250).
