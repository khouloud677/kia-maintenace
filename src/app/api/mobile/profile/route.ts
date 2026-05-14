import { requireMobileUser } from "@/lib/keycloak";
import { prisma } from "@/lib/prisma";
import { mobileProfileSchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

async function ensureUser(request: NextRequest) {
  const principal = await requireMobileUser(request);
  if (!principal) {
    return null;
  }

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

export async function GET(request: NextRequest) {
  const user = await ensureUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: NextRequest) {
  const user = await ensureUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = mobileProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      email: parsed.data.email || null,
      fullName: parsed.data.fullName || null,
      phone: parsed.data.phone || null,
    },
  });

  return NextResponse.json(updated);
}
