import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { query } from "./db";
import bcrypt from "bcryptjs";

// Validate required environment variables (only at runtime, not during build)
function validateAuthEnv() {
  const requiredEnvVars = ["DATABASE_URL", "NEXTAUTH_SECRET"];
  const missing: string[] = [];

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  if (missing.length > 0) {
    const message = `\n❌ Missing required environment variables for authentication:\n${missing.map((v) => `   - ${v}`).join("\n")}\n\nPlease set these in your .env.local file. See .env.example for reference.\n`;
    throw new Error(message);
  }
}

// Get session duration from environment (default: 24 hours)
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || "86400", 10);

export const { handlers, auth, signIn, signOut } = NextAuth({
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

          // Check if user is active
          if (user.status !== "Active") {
            throw new Error("User account is inactive");
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE, // Configured via SESSION_MAX_AGE env var (default: 24 hours)
  },
});
