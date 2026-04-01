export const CONTACT_TYPES = ["CUSTOMER", "SUPPLIER", "BOTH"] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

export function normalizeContactType(value?: string | null): ContactType {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (["supplier", "vendor"].includes(normalized)) {
    return "SUPPLIER";
  }

  if (normalized === "both") {
    return "BOTH";
  }

  return "CUSTOMER";
}

export function mapContactTypeToLegacyValue(value?: string | null): string {
  const normalized = normalizeContactType(value);

  if (normalized === "SUPPLIER") {
    return "supplier";
  }

  if (normalized === "BOTH") {
    return "both";
  }

  return "customer";
}

export function contactMatchesUsage(value: string | null | undefined, usage: "invoice" | "expense" | "all" = "all") {
  const normalized = normalizeContactType(value);

  if (usage === "invoice") {
    return normalized === "CUSTOMER" || normalized === "BOTH";
  }

  if (usage === "expense") {
    return normalized === "SUPPLIER" || normalized === "BOTH";
  }

  return true;
}
