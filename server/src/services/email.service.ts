import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

function getTransporter() {
  dotenv.config();
  const user = process.env.SMTP_EMAIL?.trim();
  const pass = (process.env.SMTP_PASSWORD || "").replace(/\s+/g, "");

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

export async function sendWelcomeEmail(
  clientEmail: string,
  contactPerson: string,
  companyName: string
): Promise<boolean> {
  try {
    const user = process.env.SMTP_EMAIL?.trim();
    const pass = (process.env.SMTP_PASSWORD || "").replace(/\s+/g, "");

    if (!user || !pass) {
      console.warn("[EmailService] Email credentials not configured (SMTP_EMAIL or SMTP_PASSWORD missing). Skipping welcome email.");
      return false;
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.warn("[EmailService] Failed to initialize SMTP transporter. Skipping welcome email.");
      return false;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px 0;">
          <h2 style="color: #4A90E2;">Welcome to Agnivridhi India Private Limited!</h2>
        </div>
        <p>Dear ${contactPerson} (${companyName}),</p>
        <p>Thank you for choosing us! Your registration has been successfully approved by our management team.</p>
        <p>You can now log in to your dedicated client portal to track the progress of your application, view agreements, and manage your documents.</p>
        
        <div style="background-color: #f8f9fa; border-left: 4px solid #4A90E2; padding: 15px; margin: 20px 0;">
          <h4 style="margin-top: 0; margin-bottom: 10px;">Your Login Credentials</h4>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${clientEmail}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> password123</p>
        </div>
        
        <p style="color: #d9534f; font-weight: bold;">
          Important Note: For your security, we strongly recommend that you change your password immediately after logging in for the first time.
        </p>
        
        <p>We look forward to serving you!</p>
        <p>Best Regards,<br/><strong>Agnivridhi India Private Limited</strong></p>
      </div>
    `;

    console.log(`[EmailService] Sending welcome email to ${clientEmail} via ${user}...`);

    const info = await transporter.sendMail({
      from: `"Agnivridhi India" <${user}>`,
      to: clientEmail,
      subject: "Welcome to Agnivridhi India - Your Account is Ready",
      html: htmlContent,
    });

    console.log(`[EmailService] ✓ Welcome email successfully sent to ${clientEmail} (ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error(`[EmailService] ✕ Error sending welcome email to ${clientEmail}:`, error.message || error);
    return false;
  }
}

