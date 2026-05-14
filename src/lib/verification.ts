import crypto from "crypto";

const CODE_LENGTH = 6;

export function generateOtpCode() {
  return Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * 10)).join("");
}

export function hashOtp(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function safeCompareHash(plainCode: string, expectedHash: string) {
  const digest = hashOtp(plainCode);
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expectedHash));
}

export function maskContact(contact: string) {
  if (contact.includes("@")) {
    const [name, domain] = contact.split("@");
    const left = name.slice(0, 2);
    return `${left}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
  }

  const visible = contact.slice(-2);
  return `${"*".repeat(Math.max(1, contact.length - 2))}${visible}`;
}
