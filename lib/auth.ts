import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { query } from "./db";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

type LicenseCheckResult = {
  allowed: boolean;
  companyId: number;
  planType: string;
  maxUsers: number;
  currentUsers: number;
  subscriptionStatus: string;
  expiryDate: string | null;
};

async function ensureCompanyLicensingSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      plan_type VARCHAR(50) NOT NULL DEFAULT 'FREE',
      max_users INTEGER NOT NULL DEFAULT 1,
      subscription_status VARCHAR(50) NOT NULL DEFAULT 'Active',
      expiry_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS company_id INTEGER
  `);

  const companyCountRes = await query(`SELECT COUNT(*)::int AS count FROM companies`);
  if (Number(companyCountRes.rows[0]?.count || 0) === 0) {
    const settingsRes = await query(`SELECT name FROM company_settings LIMIT 1`).catch(() => ({ rows: [] }));
    const defaultCompanyName = settingsRes.rows[0]?.name || "Microtronic Thailand";

    await query(
      `
        INSERT INTO companies (name, plan_type, max_users, subscription_status, expiry_date)
        VALUES ($1, 'FREE', 1, 'Active', NULL)
      `,
      [defaultCompanyName]
    );
  }

  const defaultCompanyRes = await query(`SELECT id FROM companies ORDER BY id ASC LIMIT 1`);
  const defaultCompanyId = Number(defaultCompanyRes.rows[0]?.id || 1);

  await query(`UPDATE users SET company_id = $1 WHERE company_id IS NULL`, [defaultCompanyId]);

  return defaultCompanyId;
}

export async function getDefaultCompanyId() {
  return ensureCompanyLicensingSchema();
}

export async function getUserCompanyId(userId?: string | number | null) {
  const defaultCompanyId = await ensureCompanyLicensingSchema();
  if (!userId) return defaultCompanyId;

  const userRes = await query(`SELECT company_id FROM users WHERE id = $1 LIMIT 1`, [userId]);
  return Number(userRes.rows[0]?.company_id || defaultCompanyId);
}

export async function checkUserLimit(company_id?: string | number | null): Promise<LicenseCheckResult> {
  const defaultCompanyId = await ensureCompanyLicensingSchema();
  const resolvedCompanyId = Number(company_id || defaultCompanyId);

  const companyRes = await query(
    `
      SELECT
        id,
        plan_type,
        max_users,
        subscription_status,
        expiry_date
      FROM companies
      WHERE id = $1
      LIMIT 1
    `,
    [resolvedCompanyId]
  );

  const company = companyRes.rows[0] || {
    id: resolvedCompanyId,
    plan_type: "FREE",
    max_users: 1,
    subscription_status: "Active",
    expiry_date: null,
  };

  const usersRes = await query(
    `SELECT COUNT(*)::int AS count FROM users WHERE company_id = $1`,
    [resolvedCompanyId]
  );

  const currentUsers = Number(usersRes.rows[0]?.count || 0);
  const maxUsers = Number(company.max_users || 1);
  const subscriptionStatus = String(company.subscription_status || "Active");
  const expiryDate = company.expiry_date ? new Date(company.expiry_date).toISOString() : null;
  const isExpired = expiryDate ? new Date(expiryDate).getTime() < Date.now() : false;
  const allowed = subscriptionStatus.toLowerCase() === "active" && !isExpired && currentUsers < maxUsers;

  return {
    allowed,
    companyId: resolvedCompanyId,
    planType: String(company.plan_type || "FREE"),
    maxUsers,
    currentUsers,
    subscriptionStatus,
    expiryDate,
  };
}

// Validate required environment variables (only at runtime, not during build)
function validateAuthEnv() {
  const dbExists = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  const authSecretExists = !!(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || process.env.NEXT_AUTH_SECRET);
  const missing: string[] = [];

  if (!dbExists) missing.push("DATABASE_URL (or POSTGRES_URL)");
  if (!authSecretExists) missing.push("AUTH_SECRET (or NEXTAUTH_SECRET)");

  if (missing.length > 0) {
    const message = `\n❌ Missing required environment variables for authentication:\n${missing.map((v) => `   - ${v}`).join("\n")}\n\nPlease set these in your .env.local file. See .env.example for reference.\n`;
    throw new Error(message);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate environment variables at runtime
        validateAuthEnv();

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          await ensureCompanyLicensingSchema();

          // Query user from database
          const res = await query(
            "SELECT id, email, password, name, role, status, company_id FROM users WHERE email = $1",
            [credentials.email]
          );

          if (res.rows.length === 0) {
            throw new Error("User not found");
          }

          const user = res.rows[0];

          // Check if user is active (allow Pending for waiting room)
          if (user.status === "Inactive") {
            throw new Error("บัญชีของคุณถูกระงับการใช้งาน");
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!passwordMatch) {
            throw new Error("Invalid password");
          }

          // Return user object
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.company_id?.toString(),
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
});
