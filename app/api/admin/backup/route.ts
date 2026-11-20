import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, authErrorResponse } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/backup
 * 
 * PRIVILEGED ENDPOINT: Exports entire database as backup
 * REQUIRES: authenticated admin user only
 * 
 * Sensitive data: all users, payments, invoices, contacts, accounting entries
 * All access is logged for audit trail
 */
export async function GET(req: NextRequest) {
  try {
    // 1–2. ตรวจ session + สถานะล่าสุด + สิทธิ์ admin กลาง (รองรับ superadmin)
    const guard = await requireAdmin();
    if (!guard.ok) return authErrorResponse(guard);

    // 3. Log audit trail before exporting — ไม่แนบอีเมลลง log
    const timestamp = new Date().toISOString();
    console.log(`[AUDIT] Database backup initiated (ID: ${guard.userId}) at ${timestamp}`);

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    const tables = [
      'company_settings',
      'chart_of_accounts',
      'journal_entries',
      'expenses',
      'invoices',
      'invoice_items',
      'contacts',
      'users',
      'groups',
      'group_permissions',
      'user_groups',
      'payments',
      'payment_vouchers',
      'document_patterns'
    ];

    const backupData: Record<string, any[]> = {};

    for (const table of tables) {
      // ไม่แอบใช้ [] แทนตารางที่อ่านไม่ได้ — ไม่งั้น backup จะดูสำเร็จแต่ข้อมูลหาย
      const res = await query(`SELECT * FROM ${table} ORDER BY id ASC`);
      backupData[table] = res.rows;
    }

    if (format === 'json') {
      console.log(`[AUDIT] Backup exported as JSON (ID: ${guard.userId})`);
      return new NextResponse(JSON.stringify(backupData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename=backup_${Date.now()}.json`
        }
      });
    } else {
      // Create a simple pseudo-SQL file (INSERT INTO statements)
      let sqlContent = `-- Micro-Account Database Backup\n-- Date: ${new Date().toISOString()}\n-- Exported by user ID: ${guard.userId}\n\nBEGIN;\n\n`;

      for (const table of tables) {
        if (backupData[table].length === 0) continue;

        sqlContent += `-- Data for ${table}\n`;
        const columns = Object.keys(backupData[table][0]);

        for (const row of backupData[table]) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val)}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });

          sqlContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
        sqlContent += '\n';
      }

      sqlContent += "COMMIT;";

      console.log(`[AUDIT] Backup exported as SQL (ID: ${guard.userId})`);
      return new NextResponse(sqlContent, {
        headers: {
          "Content-Type": "text/sql",
          "Content-Disposition": `attachment; filename=backup_${Date.now()}.sql`
        }
      });
    }

  } catch {
    console.error(`[ERROR] Backup operation failed — export aborted`);
    return NextResponse.json(
      { error: "Backup failed — no partial file was returned" },
      { status: 500 }
    );
  }
}
