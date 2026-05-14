import { prisma } from "@/lib/prisma";
import { feedbackSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: {
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      appointmentReference: parsed.data.appointmentReference || null,
    },
  });

  return NextResponse.json(feedback, { status: 201 });
}
