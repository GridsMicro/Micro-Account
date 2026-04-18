export type AppModule = {
  id: string;
  label: string;
  icon: string;
  category:
    | "sales"
    | "operations"
    | "master_data"
    | "reports"
    | "admin";
  route?: string;
  requiresAdmin?: boolean;
  enabledByDefault?: boolean;
  description?: string;
};

export const MODULE_REGISTRY: AppModule[] = [
  // ==================== SALES ====================
  { id: "quotations", label: "ใบเสนอราคา (QT)", icon: "fileText", category: "sales", route: "/quotations", enabledByDefault: true },
  { id: "invoices", label: "ใบแจ้งหนี้ (INV)", icon: "receipt", category: "sales", route: "/invoices", enabledByDefault: true },
  { id: "recurring", label: "รอบบิลอัตโนมัติ", icon: "repeat", category: "sales", route: "/recurring", enabledByDefault: true },
  { id: "receipts", label: "ใบเสร็จรับเงิน", icon: "creditCard", category: "sales", route: "/receipts", enabledByDefault: true },

  // ==================== OPERATIONS ====================
  { id: "expenses", label: "ค่าใช้จ่าย/ซัพพลายเออร์", icon: "wallet", category: "operations", route: "/expenses", enabledByDefault: true },
  { id: "payroll", label: "ค่าแรงพนง", icon: "banknote", category: "operations", route: "/payroll", enabledByDefault: true },
  { id: "vouchers", label: "ใบสำคัญจ่าย", icon: "banknote", category: "operations", route: "/vouchers", enabledByDefault: true },
  { id: "journals", label: "สมุดรายวัน (Journals)", icon: "library", category: "operations", route: "/journals", enabledByDefault: true },

  // ==================== MASTER DATA ====================
  { id: "inventory", label: "คลังสินค้า (Stock)", icon: "package", category: "master_data", route: "/inventory", enabledByDefault: true },
  { id: "services", label: "ราคากลางบริการ (Services)", icon: "briefcase", category: "master_data", route: "/services", enabledByDefault: true },
  { id: "coa", label: "ผังบัญชี (COA)", icon: "pieChart", category: "master_data", route: "/admin/coa", enabledByDefault: true },
  { id: "contacts", label: "ผู้ติดต่อ / คู่ค้า (Contacts)", icon: "users", category: "master_data", route: "/contacts", enabledByDefault: true },

  // ==================== REPORTS ====================
  { id: "tax_reports", label: "รายงานภาษี", icon: "fileText", category: "reports", route: "/tax-reports", enabledByDefault: true },
  { id: "reports", label: "งบกำไรขาดทุน (P&L)", icon: "barChart", category: "reports", route: "/reports/profit-loss", enabledByDefault: true },

  // ==================== ADMIN ====================
  { id: "member_management", label: "จัดการสมาชิก", icon: "userCog", category: "admin", route: "/admin/members", requiresAdmin: true, enabledByDefault: true },
  { id: "groups", label: "จัดการกลุ่ม/สิทธิ์", icon: "shieldCheck", category: "admin", route: "/admin/groups", requiresAdmin: true, enabledByDefault: true },
  { id: "modules_control", label: "โมดูล/ตั้งค่า", icon: "settings", category: "admin", route: "/admin/modules", requiresAdmin: true, enabledByDefault: true },
  { id: "backup", label: "Database Backup", icon: "database", category: "admin", route: "/admin/backup", requiresAdmin: true, enabledByDefault: true },
];

export const MODULE_CATEGORIES: Array<{ id: AppModule["category"]; label: string }> = [
  { id: "sales", label: "SALES" },
  { id: "operations", label: "OPERATIONS" },
  { id: "master_data", label: "MASTER DATA" },
  { id: "reports", label: "REPORTS" },
  { id: "admin", label: "ADMIN" },
];

function isEnabledByEnv(moduleId: string, fallback: boolean): boolean {
  const envKey = `NEXT_PUBLIC_MODULE_${moduleId.toUpperCase()}`;
  const value = process.env[envKey];
  if (!value) return fallback;
  return value === "1" || value.toLowerCase() === "true";
}

export function getEnabledModules() {
  return MODULE_REGISTRY.filter((mod) => isEnabledByEnv(mod.id, mod.enabledByDefault !== false));
}

export function applyModuleOverrides(
  baseModules: AppModule[],
  overrides: Record<string, boolean>
) {
  return baseModules.filter((mod) => {
    const override = overrides[mod.id];
    if (typeof override === "boolean") return override;
    return true;
  });
}

export function getPermissionModules() {
  return MODULE_REGISTRY.filter((mod) => mod.category !== "admin" && mod.id !== "backup" && !mod.id.startsWith("journals_"))
    .map((mod) => ({
      id: mod.id,
      name: mod.label,
      icon: mod.icon,
    }));
}

