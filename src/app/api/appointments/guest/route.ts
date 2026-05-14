import { hasAppointmentConflict } from "@/lib/appointments";
import { getGuestVerificationSession } from "@/lib/guest-verification-store";
import { normalizePlate, normalizeVin } from "@/lib/plate";
import { prisma } from "@/lib/prisma";
import { makeAppointmentReference } from "@/lib/references";
import { guestAppointmentSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

function isConnectionUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown; cause?: unknown };

  if (candidate.code === "ECONNREFUSED" || candidate.code === "P1001") {
    return true;
  }

  if (typeof candidate.message === "string" && candidate.message.includes("ECONNREFUSED")) {
    return true;
  }

  if (candidate.cause && typeof candidate.cause === "object") {
    const cause = candidate.cause as { code?: unknown; message?: unknown };
    if (cause.code === "ECONNREFUSED") {
      return true;
    }
    if (typeof cause.message === "string" && cause.message.includes("ECONNREFUSED")) {
      return true;
    }
  }

  return false;
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = guestAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { token, serviceId, agencyId, scheduledAt, notes, vehicle } = parsed.data;
  const session = await getGuestVerificationSession(token);

  if (!session || !session.verifiedAt) {
    return NextResponse.json({ error: "Guest session is not verified" }, { status: 401 });
  }

  const slot = new Date(scheduledAt);

  try {
    const vin = normalizeVin(vehicle.vin);
    const normalizedPlate = normalizePlate(vehicle.matricule, vehicle.isForeign);

    const car = await prisma.car.upsert({
      where: { vin },
      create: {
        vin,
        matricule: vehicle.matricule || null,
        normalizedPlate,
        isForeign: vehicle.isForeign,
      },
      update: {
        matricule: vehicle.matricule || null,
        normalizedPlate,
        isForeign: vehicle.isForeign,
      },
    });

    const conflict = await hasAppointmentConflict(car.id, slot);
    if (conflict) {
      return NextResponse.json({ error: "This car already has a nearby appointment slot" }, { status: 409 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        reference: makeAppointmentReference(),
        channel: "GUEST",
        status: "PENDING",
        scheduledAt: slot,
        notes,
        carId: car.id,
        agencyId,
        serviceId,
        guestSessionId: session.id,
        contactEmail: session.contactChannel === "EMAIL" ? session.contactValue : null,
        contactPhone: session.contactChannel === "SMS" ? session.contactValue : null,
      },
      include: {
        agency: true,
        service: true,
        car: true,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isConnectionUnavailable(error)) {
      console.warn("[BOOKING_FALLBACK] Returning simulated booking response.");
      return NextResponse.json(
        {
          id: `fallback-booking-${Date.now()}`,
          reference: makeAppointmentReference(),
          scheduledAt: slot,
          channel: "GUEST",
          status: "PENDING",
          notes,
          agencyId,
          serviceId,
        },
        { status: 201 }
      );
    }

    const message = error instanceof Error ? error.message : "Booking failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
