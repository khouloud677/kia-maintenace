import { guestVerificationStartSchema } from "@/lib/schemas";
import { generateOtpCode, hashOtp, maskContact } from "@/lib/verification";
import { sendEmail, sendSms } from "@/lib/notifications";
import {
  createGuestVerificationSession,
  deleteGuestVerificationSession,
} from "@/lib/guest-verification-store";
import { NextResponse } from "next/server";
import crypto from "crypto";

type StartVerificationResponse = {
  token: string;
  maskedContact: string;
  expiresAt: Date;
};

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = guestVerificationStartSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { channel, contactValue } = parsed.data;
  const code = generateOtpCode();
  const token = crypto.randomBytes(24).toString("hex");

  const session = await createGuestVerificationSession({
    token,
    contactChannel: channel,
    contactValue,
    verificationHash: hashOtp(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  try {
    if (channel === "EMAIL") {
      await sendEmail({
        to: contactValue,
        subject: "Kia RDV verification code",
        text: `Your Kia RDV verification code is ${code}. This code expires in 10 minutes.`,
        html: `<p>Your Kia RDV verification code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
      });
    } else {
      await sendSms(contactValue, `Kia RDV verification code: ${code}`);
    }
  } catch (error) {
    await deleteGuestVerificationSession(session.token);

    const detail = error instanceof Error ? error.message : "Unknown provider error";
    console.error("[VERIFICATION_SEND_ERROR]", detail);

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Failed to send verification code. Please try again."
            : `Failed to send verification code: ${detail}`,
      },
      { status: 502 }
    );
  }

  const response: StartVerificationResponse = {
    token: session.token,
    maskedContact: maskContact(contactValue),
    expiresAt: session.expiresAt,
  };

  return NextResponse.json(response);
}
