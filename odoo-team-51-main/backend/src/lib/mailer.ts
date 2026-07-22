import nodemailer from "nodemailer";
import { env } from "../config/env";

// `service: "gmail"` only works with a 16-char App Password (requires 2-Step
// Verification on the sending account) — Gmail rejects regular account
// passwords for SMTP auth.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: env.SMTP_USER, pass: env.SMTP_APP_PASSWORD },
});

export async function sendPasswordResetEmail(to: string, rawToken: string): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  await transporter.sendMail({
    from: env.SMTP_USER,
    to,
    subject: "Reset your PINERP password",
    html: `
      <p>We received a request to reset your PINERP password.</p>
      <p><a href="${resetUrl}">Click here to choose a new password</a></p>
      <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  });
}
