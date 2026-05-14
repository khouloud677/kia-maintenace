import { AppointmentStatus } from "@/generated/prisma/enums";
import { requireMobileUser } from "@/lib/keycloak";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const principal = await requireMobileUser(request);
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { keycloakSub: principal.sub },
  });

  if (!user) {
    return NextResponse.json({ cars: [] });
  }

  const cars = await prisma.car.findMany({
    where: { ownerId: user.id },
    include: {
      appointments: {
        where: {
          status: {
            in: [AppointmentStatus.PENDING, AppointmentStatus.IN_PROGRESS],
          },
        },
        include: {
          agency: true,
          service: true,
        },
        orderBy: { scheduledAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ cars });
}
