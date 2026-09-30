import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendWelcomeEmail(
  clientEmail: string,
  contactPerson: string,
  companyName: string
) {
  try {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.warn("Email credentials not configured. Skipping welcome email.");
      return;
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

    const info = await transporter.sendMail({
      from: `"Agnivridhi India" <${process.env.SMTP_EMAIL}>`,
      to: clientEmail,
      subject: "Welcome to Agnivridhi India - Your Account is Ready",
      html: htmlContent,
    });

    console.log("Welcome email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}
