import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Define email transporter
let transporter: nodemailer.Transporter;

// Initialize transporter based on environment
if (process.env.NODE_ENV === "production") {
  // Production SMTP settings
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "user@example.com",
      pass: process.env.SMTP_PASSWORD || "password",
    },
  });
} else {
  // Development/testing configuration - use ethereal.email
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: "ethereal.user@ethereal.email", // Replace with your Ethereal email
      pass: "ethereal_password", // Replace with your Ethereal password
    },
  });
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { to, subject, html, from } = options;

    // Setup email data
    const mailOptions = {
      from: from || process.env.EMAIL_FROM || "MedEvents <noreply@medevents.com>",
      to,
      subject,
      html,
    };

    // Send mail
    const info = await transporter.sendMail(mailOptions);
    
    // Log email info in development
    if (process.env.NODE_ENV !== "production") {
      console.log("Email sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}
