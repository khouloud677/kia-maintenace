import { hasAppointmentConflict } from "@/lib/appointments";
import { requireMobileUser } from "@/lib/keycloak";
import { prisma } from "@/lib/prisma";
import { makeAppointmentReference } from "@/lib/references";
import { mobileAppointmentSchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

async function resolveUser(request: NextRequest) {
  const principal = await requireMobileUser(request);
  if (!principal) return null;

  return prisma.user.upsert({
    where: { keycloakSub: principal.sub },
    create: {
      keycloakSub: principal.sub,
      email: principal.email,
      fullName: principal.name || principal.preferred_username,
    },
    update: {
      email: principal.email,
      fullName: principal.name || principal.preferred_username,
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await resolveUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = mobileAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const car = await prisma.car.findFirst({
    where: {
      id: parsed.data.carId,
      ownerId: user.id,
    },
  });

  if (!car) {
    return NextResponse.json({ error: "Car does not belong to user" }, { status: 403 });
  }

  const slot = new Date(parsed.data.scheduledAt);
  const conflict = await hasAppointmentConflict(car.id, slot);
  if (conflict) {
    return NextResponse.json({ error: "Duplicate or overlapping appointment" }, { status: 409 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      reference: makeAppointmentReference(),
      channel: "MOBILE",
      status: "PENDING",
      scheduledAt: slot,
      notes: parsed.data.notes,
      agencyId: parsed.data.agencyId,
      serviceId: parsed.data.serviceId,
      carId: car.id,
      userId: user.id,
      contactEmail: user.email,
      contactPhone: user.phone,
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}

export async function GET(request: NextRequest) {
  const user = await resolveUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      userId: user.id,
    },
    include: {
      car: true,
      agency: true,
      service: true,
    },
    orderBy: {
      scheduledAt: "desc",
    },
  });

  return NextResponse.json(appointments);
}
