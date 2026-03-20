import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { query } from "./db";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

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
          // Query user from database
          const res = await query(
            "SELECT id, email, password, name, role, status FROM users WHERE email = $1",
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
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
});
