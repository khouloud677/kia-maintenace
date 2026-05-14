import nodemailer from "nodemailer";
import twilio from "twilio";

const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpEncryption = (process.env.SMTP_ENCRYPTION || "").toLowerCase();
const smtpSecure = smtpEncryption === "ssl" || smtpEncryption === "smtps" || smtpPort === 465;

function resolveSmtpPassword() {
  const password = process.env.SMTP_PASS;
  if (!password) return undefined;

  // Gmail app passwords are often copied as 4 groups separated by spaces.
  return password.replace(/\s+/g, "");
}

function resolveFromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || null;
}

const emailTransport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpSecure,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: resolveSmtpPassword(),
            }
          : undefined,
    })
  : null;

const smsClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: EmailPayload) {
  const from = resolveFromAddress();

  if (!emailTransport || !from) {
    console.info(`[EMAIL MOCK] ${to} | ${subject} | ${text}`);
    return;
  }

  await emailTransport.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

export async function sendSms(to: string, body: string) {
  if (!smsClient || !process.env.TWILIO_FROM_NUMBER) {
    console.info(`[SMS MOCK] ${to} | ${body}`);
    return;
  }

  await smsClient.messages.create({
    from: process.env.TWILIO_FROM_NUMBER,
    to,
    body,
  });
}
