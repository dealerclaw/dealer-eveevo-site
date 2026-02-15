/**
 * Email notification service for auction winners
 * Uses Resend API for reliable email delivery
 */

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Send email notification to auction winner
 * Returns true if email was sent successfully, false otherwise
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const { to, subject, html } = payload;

  // Check if Resend API key is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.warn('[Email] Resend API key not configured - skipping email send');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EVEEVO Auctions <auctions@eveevo.com>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => '');
      console.error(`[Email] Failed to send email: ${response.status} ${response.statusText}`, error);
      return false;
    }

    const result = await response.json();
    console.log(`[Email] Successfully sent email to ${to}:`, result.id);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

/**
 * Generate HTML email template for auction winner notification
 */
export function generateAuctionWinnerEmail(data: {
  dealerName: string;
  vehicleInfo: string;
  vin: string;
  winningBid: number;
  auctionEndDate: Date;
  sellerName: string;
  sellerContact: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auction Won - EVEEVO</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #9BCB90 0%, #5C927A 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .vehicle-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 600;
      color: #6b7280;
    }
    .value {
      color: #111827;
    }
    .winning-bid {
      font-size: 32px;
      font-weight: bold;
      color: #9BCB90;
      text-align: center;
      margin: 20px 0;
    }
    .next-steps {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 20px 0;
    }
    .next-steps h3 {
      margin-top: 0;
      color: #92400e;
    }
    .next-steps ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .next-steps li {
      margin: 8px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background: #9BCB90;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏆 Congratulations, ${data.dealerName}!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px;">You won the auction</p>
  </div>
  
  <div class="content">
    <p>Great news! You have successfully won the auction for:</p>
    
    <div class="vehicle-info">
      <div class="info-row">
        <span class="label">Vehicle:</span>
        <span class="value">${data.vehicleInfo}</span>
      </div>
      <div class="info-row">
        <span class="label">VIN:</span>
        <span class="value">${data.vin || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Auction Ended:</span>
        <span class="value">${data.auctionEndDate.toLocaleString('en-GB', { 
          dateStyle: 'long', 
          timeStyle: 'short' 
        })}</span>
      </div>
    </div>
    
    <div class="winning-bid">
      £${data.winningBid.toLocaleString()}
    </div>
    
    <div class="next-steps">
      <h3>⚡ Next Steps</h3>
      <ol>
        <li><strong>Payment:</strong> Complete payment within 48 hours to secure your purchase</li>
        <li><strong>Contact Seller:</strong> Arrange delivery or pickup with ${data.sellerName}</li>
        <li><strong>Inspection:</strong> Review the vehicle inspection report if available</li>
        <li><strong>Documentation:</strong> Ensure all paperwork is completed for transfer</li>
      </ol>
    </div>
    
    <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <strong>Seller Contact:</strong><br>
      ${data.sellerName}<br>
      ${data.sellerContact}
    </div>
    
    <p style="margin-top: 30px;">
      Thank you for participating in EVEEVO auctions. We're committed to making electric vehicle trading 
      simple, transparent, and efficient for dealers like you.
    </p>
  </div>
  
  <div class="footer">
    <p>EVEEVO - Smart. Easy. Electric.</p>
    <p style="font-size: 12px; color: #9ca3af;">
      This is an automated notification. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
  `.trim();
}
