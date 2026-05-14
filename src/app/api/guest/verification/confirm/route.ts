import { guestVerificationConfirmSchema } from "@/lib/schemas";
import { getGuestVerificationSession, updateGuestVerificationSession } from "@/lib/guest-verification-store";
import { safeCompareHash } from "@/lib/verification";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = guestVerificationConfirmSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { token, code } = parsed.data;
  const session = await getGuestVerificationSession(token);

  if (!session) {
    return NextResponse.json({ error: "Invalid session token" }, { status: 404 });
  }

  if (session.expiresAt < new Date()) {
    return NextResponse.json({ error: "Verification code expired" }, { status: 400 });
  }

  if (session.attempts >= 5) {
    return NextResponse.json({ error: "Maximum attempts reached" }, { status: 429 });
  }

  const isValid = safeCompareHash(code, session.verificationHash);

  if (!isValid) {
    await updateGuestVerificationSession(token, {
      attempts: { increment: 1 },
    });
    return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
  }

  await updateGuestVerificationSession(token, {
    verifiedAt: new Date(),
  });

  return NextResponse.json({ verified: true });
}
