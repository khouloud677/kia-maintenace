import { normalizePlate, normalizeVin } from "@/lib/plate";
import { prisma } from "@/lib/prisma";
import { trackSchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const payload = {
    reference: request.nextUrl.searchParams.get("reference") || undefined,
    vin: request.nextUrl.searchParams.get("vin") || undefined,
    matricule: request.nextUrl.searchParams.get("matricule") || undefined,
  };

  const parsed = trackSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { reference, vin, matricule } = parsed.data;

  const where = reference
    ? { reference }
    : vin
      ? {
          car: {
            vin: normalizeVin(vin),
            ...(matricule ? { normalizedPlate: normalizePlate(matricule) } : {}),
          },
        }
      : {
          car: {
            normalizedPlate: normalizePlate(matricule),
          },
        };

  const appointment = await prisma.appointment.findFirst({
    where,
    include: {
      agency: true,
      service: true,
      car: true,
    },
    orderBy: {
      scheduledAt: "desc",
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  return NextResponse.json({
    reference: appointment.reference,
    status: appointment.status,
    scheduledAt: appointment.scheduledAt,
    service: appointment.service.name,
    agency: appointment.agency.name,
    city: appointment.agency.city,
    vin: appointment.car.vin,
    matricule: appointment.car.matricule,
  });
}
