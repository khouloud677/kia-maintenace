import { requireMobileUser } from "@/lib/keycloak";
import { normalizePlate, normalizeVin } from "@/lib/plate";
import { prisma } from "@/lib/prisma";
import { mobileCarSchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

async function ensureUserId(request: NextRequest) {
  const principal = await requireMobileUser(request);
  if (!principal) return null;

  const user = await prisma.user.upsert({
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

  return user.id;
}

export async function GET(request: NextRequest) {
  const userId = await ensureUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cars = await prisma.car.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cars);
}

export async function POST(request: NextRequest) {
  const userId = await ensureUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = mobileCarSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const vin = normalizeVin(parsed.data.vin);
  const car = await prisma.car.upsert({
    where: { vin },
    create: {
      vin,
      ownerId: userId,
      matricule: parsed.data.matricule || null,
      isForeign: parsed.data.isForeign,
      normalizedPlate: normalizePlate(parsed.data.matricule, parsed.data.isForeign),
    },
    update: {
      ownerId: userId,
      matricule: parsed.data.matricule || null,
      isForeign: parsed.data.isForeign,
      normalizedPlate: normalizePlate(parsed.data.matricule, parsed.data.isForeign),
    },
  });

  return NextResponse.json(car, { status: 201 });
}
