export type FallbackService = {
  id: string;
  code: string;
  name: string;
  description: string;
  durationMin: number;
  priceEstimate: number;
};

export type FallbackAgency = {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  services: Array<Pick<FallbackService, "id" | "code" | "name">>;
};

export const fallbackServices: FallbackService[] = [
  {
    id: "cma01kiaservicea0000000001",
    code: "OIL",
    name: "Oil Change",
    description: "Engine oil and filter replacement",
    durationMin: 60,
    priceEstimate: 180,
  },
  {
    id: "cma01kiaserviceb0000000002",
    code: "BRAKE",
    name: "Brake Inspection",
    description: "Brake pads and braking system diagnostics",
    durationMin: 90,
    priceEstimate: 220,
  },
  {
    id: "cma01kiaservicec0000000003",
    code: "DIAG",
    name: "Full Diagnostics",
    description: "ECU scan and maintenance checks",
    durationMin: 120,
    priceEstimate: 260,
  },
];

const compactServices = fallbackServices.map((service) => ({
  id: service.id,
  code: service.code,
  name: service.name,
}));

export const fallbackAgencies: FallbackAgency[] = [
  {
    id: "cma01kiaagencya0000000001",
    name: "Kia Tunis Lac",
    city: "Tunis",
    address: "Les Berges du Lac 1, Tunis",
    latitude: 36.846,
    longitude: 10.2729,
    phone: "+21670001001",
    services: compactServices,
  },
  {
    id: "cma01kiaagencyb0000000002",
    name: "Kia Sfax Centre",
    city: "Sfax",
    address: "Route de Gremda, Sfax",
    latitude: 34.7406,
    longitude: 10.7603,
    phone: "+21670001002",
    services: compactServices,
  },
  {
    id: "cma01kiaagencyc0000000003",
    name: "Kia Sousse Corniche",
    city: "Sousse",
    address: "Avenue Habib Bourguiba, Sousse",
    latitude: 35.8256,
    longitude: 10.6369,
    phone: "+21670001003",
    services: compactServices,
  },
];

export function isConnectionUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    cause?: unknown;
  };

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