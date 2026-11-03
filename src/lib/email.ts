
import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT || 465);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Verify your email address",
    text: `Your email verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Verify your email</h2>
        <p>Use this code to verify your email address:</p>
        <p style="font-size: 30px; font-weight: bold; letter-spacing: 8px;">
          ${otp}
        </p>
        <p>This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
      </div>
    `,
  });
}
