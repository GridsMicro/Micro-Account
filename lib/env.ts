/**
 * Environment Variable Validation Utility
 * Ensures all required environment variables are set at startup
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string;

  // JWT/Auth Secret (required for JWT signing/verification)
  NEXTAUTH_SECRET?: string;
  AUTH_SECRET?: string;

  // NextAuth
  NEXTAUTH_URL: string;

  // Session
  SESSION_MAX_AGE: string;
}

/**
 * Validate that all required environment variables are set
 * Called at application startup
 */
export function validateEnv(): void {
  const required: (keyof EnvConfig)[] = [
    "DATABASE_URL",
    "NEXTAUTH_URL",
  ];

  const missing: string[] = [];

  required.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  // JWT secret is CRITICAL — must have at least one of NEXTAUTH_SECRET or AUTH_SECRET
  const hasJWTSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!hasJWTSecret) {
    missing.push("NEXTAUTH_SECRET or AUTH_SECRET");
  }

  if (missing.length > 0) {
    const message = `
❌ Missing required environment variables:
${missing.map((key) => `   - ${key}`).join("\n")}

Please set these variables in your .env.local file.
See .env.example for reference.

CRITICAL: NEXTAUTH_SECRET or AUTH_SECRET must be set — this is required for JWT security.

Setup instructions: https://github.com/your-repo/blob/main/AUTH_SETUP.md
    `.trim();

    console.error(message);
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  // Validate URLs are properly formatted
  if (!process.env.NEXTAUTH_URL?.startsWith("http")) {
    throw new Error(
      "NEXTAUTH_URL must start with http:// or https://"
    );
  }

  // Validate session duration is a number
  if (process.env.SESSION_MAX_AGE) {
    const maxAge = parseInt(process.env.SESSION_MAX_AGE, 10);
    if (isNaN(maxAge) || maxAge <= 0) {
      throw new Error("SESSION_MAX_AGE must be a positive number (in seconds)");
    }
  }

  console.log("✅ Environment variables validated successfully");
}

/**
 * Get typed environment configuration
 */
export function getEnvConfig(): EnvConfig {
  validateEnv();

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    SESSION_MAX_AGE: process.env.SESSION_MAX_AGE || "86400",
  };
}
