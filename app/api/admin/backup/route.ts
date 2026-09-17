import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

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
    // 1. Verify user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      console.warn(`[AUDIT] Unauthorized backup access attempt - not authenticated`);
      return NextResponse.json(
        { error: "Unauthorized — not authenticated" },
        { status: 401 }
      );
    }

    // 2. Verify user has ADMIN role
    const userRole = session.user.role?.toUpperCase();
    if (userRole !== "ADMIN") {
      console.warn(`[AUDIT] Unauthorized backup access attempt - user ${session.user.email} (role: ${session.user.role}) denied`);
      return NextResponse.json(
        { error: "Forbidden — admin access required" },
        { status: 403 }
      );
    }

    // 3. Log audit trail before exporting
    const timestamp = new Date().toISOString();
    console.log(`[AUDIT] Database backup initiated by admin: ${session.user.email} (ID: ${session.user.id}) at ${timestamp}`);

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
      try {
        const res = await query(`SELECT * FROM ${table} ORDER BY id ASC`);
        backupData[table] = res.rows;
      } catch (err) {
        console.error(`Backup error for table ${table}:`, err);
        backupData[table] = []; // fallback for missing tables
      }
    }

    if (format === 'json') {
      console.log(`[AUDIT] Backup exported as JSON by ${session.user.email}`);
      return new NextResponse(JSON.stringify(backupData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename=backup_${Date.now()}.json`
        }
      });
    } else {
      // Create a simple pseudo-SQL file (INSERT INTO statements)
      let sqlContent = `-- Micro-Account Database Backup\n-- Date: ${new Date().toISOString()}\n-- Exported by: ${session.user.email}\n\nBEGIN;\n\n`;

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

      console.log(`[AUDIT] Backup exported as SQL by ${session.user.email}`);
      return new NextResponse(sqlContent, {
        headers: {
          "Content-Type": "text/sql",
          "Content-Disposition": `attachment; filename=backup_${Date.now()}.sql`
        }
      });
    }

  } catch (error: any) {
    console.error(`[ERROR] Backup operation failed:`, error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
