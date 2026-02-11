import nodemailer from 'nodemailer';

/**
 * Send email notification
 * Uses a test account for development - in production, configure with real SMTP credentials
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
}) {
  try {
    // Create test account for development
    const testAccount = await nodemailer.createTestAccount();

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: '"EVEEVO" <noreply@eveevo.com>',
      to,
      subject,
      text,
      html,
    });

    console.log('[Email] Message sent: %s', info.messageId);
    console.log('[Email] Preview URL: %s', nodemailer.getTestMessageUrl(info));

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send dealer application notification to admin
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
    <h2>New Dealer Application</h2>
    <p>A new dealer has applied to join EVEEVO.</p>
    
    <h3>Business Information</h3>
    <ul>
      <li><strong>Business Name:</strong> ${application.businessName}</li>
      <li><strong>Contact Name:</strong> ${application.contactName}</li>
      <li><strong>Email:</strong> ${application.email}</li>
      <li><strong>Phone:</strong> ${application.phone}</li>
      <li><strong>Address:</strong> ${application.address}</li>
    </ul>
    
    <h3>Description</h3>
    <p>${application.description}</p>
    
    <p>Please review this application in the admin dashboard.</p>
  `;

  const text = `
New Dealer Application

Business Information:
- Business Name: ${application.businessName}
- Contact Name: ${application.contactName}
- Email: ${application.email}
- Phone: ${application.phone}
- Address: ${application.address}

Description:
${application.description}

Please review this application in the admin dashboard.
  `;

  return await sendEmail({
    to: 'anthony.perry@eveevo.com',
    subject: `New Dealer Application - ${application.businessName}`,
    html,
    text,
  });
}
