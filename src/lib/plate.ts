export function normalizePlate(matricule?: string | null, isForeign = false) {
  if (isForeign) {
    return "FOREIGN";
  }

  return (matricule || "").toUpperCase().replace(/\s+/g, "").trim();
}

export function normalizeVin(vin: string) {
  return vin.toUpperCase().replace(/\s+/g, "").trim();
}
