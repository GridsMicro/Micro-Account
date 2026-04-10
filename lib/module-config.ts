import { query } from "@/lib/db";

export async function ensureModuleConfigSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS company_module_settings (
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      module_id VARCHAR(100) NOT NULL,
      is_enabled BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      PRIMARY KEY (company_id, module_id)
    )
  `);
}

export async function getCompanyModuleOverrides(companyId: number): Promise<Record<string, boolean>> {
  await ensureModuleConfigSchema();
  const result = await query(
    `SELECT module_id, is_enabled FROM company_module_settings WHERE company_id = $1`,
    [companyId]
  );

  const overrides: Record<string, boolean> = {};
  for (const row of result.rows) {
    overrides[String(row.module_id)] = row.is_enabled === true;
  }
  return overrides;
}

export async function saveCompanyModuleOverrides(
  companyId: number,
  overrides: Record<string, boolean>,
  updatedBy: number
) {
  await ensureModuleConfigSchema();
  const entries = Object.entries(overrides);

  for (const [moduleId, isEnabled] of entries) {
    await query(
      `
        INSERT INTO company_module_settings (company_id, module_id, is_enabled, updated_at, updated_by)
        VALUES ($1, $2, $3, NOW(), $4)
        ON CONFLICT (company_id, module_id)
        DO UPDATE SET
          is_enabled = EXCLUDED.is_enabled,
          updated_at = NOW(),
          updated_by = EXCLUDED.updated_by
      `,
      [companyId, moduleId, !!isEnabled, updatedBy]
    );
  }
}

