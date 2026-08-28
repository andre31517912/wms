import "server-only";
import { Resend } from "resend";

const ADMIN_EMAIL = "wuandre6@gmail.com";

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function notifyPendingRegistration(
  userName: string,
  userEmail: string
): Promise<void> {
  const r = getResend();
  if (!r) {
    console.warn("RESEND_API_KEY not set — skipping pending-account email");
    return;
  }

  const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  const { error } = await r.emails.send({
    from: "WMS Notifications <onboarding@resend.dev>",
    to: ADMIN_EMAIL,
    subject: `New pending account: ${userName}`,
    html: `
      <h2>New Account Registration</h2>
      <p>A new user has registered and is waiting for approval:</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Name</td><td>${escapeHtml(userName)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Email</td><td>${escapeHtml(userEmail)}</td></tr>
      </table>
      <p>
        <a href="${siteUrl}/admin/customers"
           style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">
          Review Pending Accounts
        </a>
      </p>
    `,
  });

  if (error) {
    console.error("Failed to send pending-account email:", error);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
