export const CORE_ROLES = ["superadmin", "admin", "user"] as const;

export type CoreRole = (typeof CORE_ROLES)[number];

export function normalizeRole(role?: string | null): CoreRole {
  const value = String(role || "").trim().toLowerCase();
  if (value === "superadmin") return "superadmin";
  if (value === "admin") return "admin";
  return "user";
}

export function canAccessAdmin(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === "superadmin" || normalized === "admin";
}
