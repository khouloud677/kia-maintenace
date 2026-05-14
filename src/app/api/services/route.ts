import { fallbackServices, isConnectionUnavailable } from "@/lib/catalog-fallback";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        durationMin: true,
        priceEstimate: true,
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isConnectionUnavailable(error)) {
      console.warn("[CATALOG_FALLBACK] Returning in-memory services catalog.");
      return NextResponse.json(fallbackServices);
    }

    return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
  }
}
