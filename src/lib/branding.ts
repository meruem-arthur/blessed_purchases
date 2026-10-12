// Letterhead / contact details used on the pages and PDF receipts.
// The school crest is always shown. Everything about the organisation using
// the portal comes from environment variables so nothing is hard-coded:
//   NEXT_PUBLIC_ORG_NAME      e.g. "Department of Mining Engineering" (optional)
//   NEXT_PUBLIC_ORG_SUBTITLE  line under "OFFICIAL PAYMENT RECEIPT" (optional)
//   NEXT_PUBLIC_ORG_ENQUIRY   e.g. "For any enquiry, call 0240000000" (optional)
//   NEXT_PUBLIC_ORG_WEBSITE   shown in the receipt footer (optional)
//   NEXT_PUBLIC_SMS_SENDER    fallback SMS sender ID, max 11 chars (optional)
// Blank values are simply left off the page / receipt.
const env = (v: string | undefined) => (v ?? "").trim();

export const BRANDING = {
  organisation: env(process.env.NEXT_PUBLIC_ORG_NAME),
  university: "UNIVERSITY OF MINES AND TECHNOLOGY, TARKWA",
  receiptSubtitle: env(process.env.NEXT_PUBLIC_ORG_SUBTITLE),
  enquiry: env(process.env.NEXT_PUBLIC_ORG_ENQUIRY),
  website: env(process.env.NEXT_PUBLIC_ORG_WEBSITE),
  smsFallbackSender: env(process.env.NEXT_PUBLIC_SMS_SENDER) || "Payments",
};
