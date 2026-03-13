/**
 * Core email notification service
 * Uses Resend API for reliable email delivery (same transport as server/email.ts)
 */

/**
 * Send a transactional email via Resend.
 * Returns { success: true } on delivery, { success: false, error } on failure.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn('[Email] RESEND_API_KEY not configured — skipping email send');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EVEEVO <noreply@eveevo.com>',
        to: [to],
        subject,
        ...(html ? { html } : {}),
        ...(text ? { text } : {}),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`[Email] Resend error ${response.status}: ${errorBody}`);
      return { success: false, error: `${response.status} ${response.statusText}` };
    }

    const result = await response.json() as { id: string };
    console.log(`[Email] Sent to ${to} — Resend ID: ${result.id}`);
    return { success: true, messageId: result.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email] Failed to send email:', message);
    return { success: false, error: message };
  }
}

/**
 * Send dealer application notification to admin.
 * Called from the dealer.submitApplication tRPC procedure.
 */
export async function sendDealerApplicationEmail(application: {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  description: string;
}) {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9">
      <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb">
        <h2 style="color:#16a34a;margin-top:0">New Dealer Application</h2>
        <p style="color:#374151">A new dealer has applied to join EVEEVO. Please review the details below.</p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#6b7280;width:140px">Business Name</td><td style="padding:8px 0;font-weight:600;color:#111827">${application.businessName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Contact Name</td><td style="padding:8px 0;color:#111827">${application.contactName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0;color:#111827"><a href="mailto:${application.email}">${application.email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Phone</td><td style="padding:8px 0;color:#111827">${application.phone}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Address</td><td style="padding:8px 0;color:#111827">${application.address}</td></tr>
        </table>

        <h3 style="color:#374151;margin-bottom:8px">Description</h3>
        <p style="color:#374151;background:#f3f4f6;padding:12px;border-radius:6px;margin:0">${application.description}</p>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb">
          <a href="https://dealer.eveevo.co.uk/admin/applications"
             style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Review in Admin Dashboard
          </a>
        </div>
      </div>
      <p style="color:#9ca3af;font-size:12px;margin-top:16px;text-align:center">
        This is an automated notification from EVEEVO. Do not reply to this email.
      </p>
    </div>
  `;

  const text = `
New Dealer Application — EVEEVO

Business Name: ${application.businessName}
Contact Name:  ${application.contactName}
Email:         ${application.email}
Phone:         ${application.phone}
Address:       ${application.address}

Description:
${application.description}

Review at: https://dealer.eveevo.co.uk/admin/applications
  `.trim();

  return await sendEmail({
    to: 'anthony.perry@eveevo.com',
    subject: `New Dealer Application — ${application.businessName}`,
    html,
    text,
  });
}
