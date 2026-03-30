import nodemailer from 'nodemailer';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function logoDataUri() {
  const logoPath = join(__dirname, 'client', 'public', 'logo-mark.svg');
  try {
    if (existsSync(logoPath)) {
      const buf = readFileSync(logoPath);
      return `data:image/svg+xml;base64,${buf.toString('base64')}`;
    }
  } catch {
    /* ignore */
  }
  return '';
}

export function createMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function buildInvoiceHtml({
  donorName,
  amount,
  currency,
  razorpayPaymentId,
  invoiceNo,
  taxExemption,
  paymentDate,
}) {
  const logo = logoDataUri();
  const amt = Number(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 2,
  }).format(amt);
  const dateStr =
    paymentDate instanceof Date
      ? paymentDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : String(paymentDate);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
    <tr>
      <td style="padding:24px 28px;background:linear-gradient(135deg,#0ea5e9 0%,#1e3a8a 100%);color:#fff;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="vertical-align:middle;">
              ${logo ? `<img src="${logo}" alt="" width="44" height="44" style="display:block;border-radius:10px;background:rgba(255,255,255,0.2);"/>` : ''}
            </td>
            <td style="padding-left:14px;vertical-align:middle;">
              <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;">Swagatham Foundation</div>
              <div style="font-size:12px;opacity:0.9;margin-top:4px;">Donation receipt & invoice</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">Dear ${escapeHtml(donorName || 'Donor')},</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#334155;">Thank you for your generous contribution. Below is your payment summary for your records.</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          <tr style="background:#f8fafc;">
            <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Invoice no.</td>
            <td style="padding:12px 16px;font-size:14px;font-weight:600;text-align:right;">${escapeHtml(invoiceNo)}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#475569;">Amount (${currency || 'INR'})</td>
            <td style="padding:12px 16px;font-size:15px;font-weight:700;text-align:right;color:#0ea5e9;">${formatted}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:12px 16px;font-size:13px;color:#475569;">Razorpay payment ID</td>
            <td style="padding:12px 16px;font-size:12px;text-align:right;word-break:break-all;">${escapeHtml(razorpayPaymentId)}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:13px;color:#475569;">Date</td>
            <td style="padding:12px 16px;font-size:13px;text-align:right;">${escapeHtml(dateStr)}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:12px 16px;font-size:13px;color:#475569;">80G requested</td>
            <td style="padding:12px 16px;font-size:13px;text-align:right;">${taxExemption ? 'Yes' : 'No'}</td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#64748b;">This email serves as an acknowledgement of your donation. For tax exemption under Section 80G, please retain this email and follow any certificate process communicated separately by the foundation.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
        Swagatham Foundation · Chennai · This is a computer-generated receipt.
      </td>
    </tr>
  </table>
</body></html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendDonationReceiptEmail({
  to,
  donorName,
  amount,
  currency,
  razorpayPaymentId,
  invoiceNo,
  taxExemption,
  paymentDate,
}) {
  const mailer = createMailer();
  if (!mailer) {
    console.log(
      `[Receipt] SMTP not configured — would email ${to} invoice ${invoiceNo}. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.`
    );
    return { sent: false };
  }

  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    'noreply@swagatham.local';
  const fromName = process.env.SMTP_FROM_NAME || 'Swagatham Foundation';

  const html = buildInvoiceHtml({
    donorName,
    amount,
    currency,
    razorpayPaymentId,
    invoiceNo,
    taxExemption,
    paymentDate,
  });

  try {
    await mailer.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject: `Donation receipt ${invoiceNo} — Swagatham Foundation`,
      html,
    });
    console.log(`[Receipt] Email sent to ${to} (${invoiceNo})`);
    return { sent: true };
  } catch (e) {
    console.error('[Receipt] Email failed:', e.message || e);
    return { sent: false, error: e.message };
  }
}
