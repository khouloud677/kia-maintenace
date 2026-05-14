import { prisma } from "@/lib/prisma";
import { reclamationSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = reclamationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reclamation = await prisma.reclamation.create({
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      message: parsed.data.message,
      appointmentReference: parsed.data.appointmentReference || null,
    },
  });

  return NextResponse.json(reclamation, { status: 201 });
}
