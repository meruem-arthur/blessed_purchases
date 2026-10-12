// Letterhead / contact details used on the pages and PDF receipts.
// The school crest and the organisation logo (public/org-logo.png) are always shown. Everything about the organisation using
// the portal comes from environment variables so nothing is hard-coded:
//   NEXT_PUBLIC_ORG_NAME      default "Consistency"
//   NEXT_PUBLIC_ORG_SUBTITLE  default "Plan • Persist • Achieve" (tagline under the receipt title)
//   NEXT_PUBLIC_ORG_ENQUIRY   e.g. "For any enquiry, call 0240000000" (optional)
//   NEXT_PUBLIC_ORG_WEBSITE   shown in the receipt footer (optional)
//   NEXT_PUBLIC_SMS_SENDER    fallback SMS sender ID, max 11 chars (optional)
// Set a variable to "" to leave that line off the page / receipt.
// Unset -> the default below. Set but blank -> left off.
const envOr = (v: string | undefined, fallback: string) => (v === undefined ? fallback : v.trim());

export const BRANDING = {
  organisation: envOr(process.env.NEXT_PUBLIC_ORG_NAME, "Consistency"),
  university: "UNIVERSITY OF MINES AND TECHNOLOGY, TARKWA",
  receiptSubtitle: envOr(process.env.NEXT_PUBLIC_ORG_SUBTITLE, "Plan • Persist • Achieve"),
  enquiry: envOr(process.env.NEXT_PUBLIC_ORG_ENQUIRY, ""),
  website: envOr(process.env.NEXT_PUBLIC_ORG_WEBSITE, ""),
  smsFallbackSender: envOr(process.env.NEXT_PUBLIC_SMS_SENDER, "") || "Consistency",
};
