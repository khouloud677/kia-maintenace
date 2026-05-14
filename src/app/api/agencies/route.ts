import { fallbackAgencies, isConnectionUnavailable } from "@/lib/catalog-fallback";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get("serviceId");

  try {
    const agencies = await prisma.agency.findMany({
      where: serviceId
        ? {
            agencyServices: {
              some: {
                serviceId,
              },
            },
          }
        : undefined,
      include: {
        agencyServices: {
          include: {
            service: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ city: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(
      agencies.map((agency) => ({
        id: agency.id,
        name: agency.name,
        city: agency.city,
        address: agency.address,
        latitude: agency.latitude,
        longitude: agency.longitude,
        phone: agency.phone,
        services: agency.agencyServices.map((item) => item.service),
      }))
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && isConnectionUnavailable(error)) {
      console.warn("[CATALOG_FALLBACK] Returning in-memory agencies catalog.");
      const agencies = serviceId
        ? fallbackAgencies.filter((agency) => agency.services.some((service) => service.id === serviceId))
        : fallbackAgencies;
      return NextResponse.json(agencies);
    }

    return NextResponse.json({ error: "Failed to load agencies" }, { status: 500 });
  }
}
