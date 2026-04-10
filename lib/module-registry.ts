export type AppModule = {
  id: string;
  label: string;
  icon: string;
  category:
    | "admin"
    | "sales_co"
    | "stock"
    | "service"
    | "hr"
    | "finance_accounting"
    | "finance_tax";
  route?: string;
  requiresAdmin?: boolean;
  enabledByDefault?: boolean;
  description?: string;
};

export const MODULE_REGISTRY: AppModule[] = [
  { id: "member_management", label: "จัดการสมาชิก", icon: "userCog", category: "admin", route: "/admin/members", requiresAdmin: true, enabledByDefault: true },
  { id: "groups", label: "จัดการกลุ่ม", icon: "shieldCheck", category: "admin", route: "/admin/groups", requiresAdmin: true, enabledByDefault: true },
  { id: "permissions", label: "จัดการสิทธิ์", icon: "shieldCheck", category: "admin", route: "/admin/permissions", requiresAdmin: true, enabledByDefault: true },
  { id: "modules_control", label: "จัดการโมดูล", icon: "settings", category: "admin", route: "/admin/modules", requiresAdmin: true, enabledByDefault: true },
  { id: "backup", label: "Database Backup", icon: "database", category: "admin", route: "/admin/backup", requiresAdmin: true, enabledByDefault: true },
  { id: "settings", label: "ตั้งค่าระบบ", icon: "settings", category: "admin", route: "/settings", requiresAdmin: true, enabledByDefault: true },

  { id: "dashboard", label: "หน้าแรก Dashboard", icon: "home", category: "sales_co", route: "/", enabledByDefault: true },
  { id: "contacts", label: "ผู้ติดต่อ / คู่ค้า", icon: "users", category: "sales_co", route: "/contacts", enabledByDefault: true },
  { id: "quotations", label: "ใบเสนอราคา (QT)", icon: "fileText", category: "sales_co", route: "/quotations", enabledByDefault: true },
  { id: "invoices", label: "ใบแจ้งหนี้ (INV)", icon: "receipt", category: "sales_co", route: "/invoices", enabledByDefault: true },
  { id: "recurring", label: "รอบบิลอัตโนมัติ", icon: "repeat", category: "sales_co", route: "/recurring", enabledByDefault: true },
  { id: "receipts", label: "ใบเสร็จรับเงิน", icon: "creditCard", category: "sales_co", route: "/receipts", enabledByDefault: true },
  { id: "payments", label: "รับ/จ่ายเงิน", icon: "creditCard", category: "sales_co", route: "/payments", enabledByDefault: true },

  { id: "inventory", label: "คลังสินค้า (Stock)", icon: "package", category: "stock", route: "/inventory", enabledByDefault: true },

  { id: "services", label: "ราคากลางบริการ", icon: "briefcase", category: "service", route: "/services", enabledByDefault: true },
  { id: "expenses", label: "ค่าแรง/ค่าอะไหล่", icon: "wallet", category: "service", route: "/expenses", enabledByDefault: true },
  { id: "vouchers", label: "ใบสำคัญจ่าย", icon: "banknote", category: "service", route: "/vouchers", enabledByDefault: true },

  { id: "payroll", label: "รายการค่าแรง (HR)", icon: "banknote", category: "hr", route: "/payroll", enabledByDefault: true },

  { id: "journals_sales", label: "สมุดรายวันขาย (Sales)", icon: "shoppingCart", category: "finance_accounting", route: "/journals?type=sales", enabledByDefault: true },
  { id: "journals_receipt", label: "สมุดรายวันรับเงิน (Receipt)", icon: "creditCard", category: "finance_accounting", route: "/journals?type=receipt", enabledByDefault: true },
  { id: "journals_purchase", label: "สมุดรายวันซื้อ (Purchase)", icon: "truck", category: "finance_accounting", route: "/journals?type=purchase", enabledByDefault: true },
  { id: "journals_payment", label: "สมุดรายวันจ่ายเงิน (Payment)", icon: "banknote", category: "finance_accounting", route: "/journals?type=payment", enabledByDefault: true },
  { id: "journals", label: "สมุดรายวันทั่วไป (General)", icon: "library", category: "finance_accounting", route: "/journals", enabledByDefault: true },
  { id: "coa", label: "ผังบัญชี (COA)", icon: "pieChart", category: "finance_accounting", route: "/admin/coa", requiresAdmin: true, enabledByDefault: true },
  { id: "reports", label: "งบกำไรขาดทุน (P&L)", icon: "barChart", category: "finance_accounting", route: "/reports/profit-loss", requiresAdmin: true, enabledByDefault: true },

  { id: "tax_reports", label: "รายงานภาษี", icon: "barChart", category: "finance_tax", route: "/tax-reports", requiresAdmin: true, enabledByDefault: true },
];

export const MODULE_CATEGORIES: Array<{ id: AppModule["category"]; label: string }> = [
  { id: "admin", label: "Administration" },
  { id: "finance_accounting", label: "Finance - Accounting" },
  { id: "finance_tax", label: "Finance - Tax" },
  { id: "stock", label: "Stock" },
  { id: "hr", label: "Human Resources" },
  { id: "sales_co", label: "Sales-Co" },
  { id: "service", label: "Service" },
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

