import type { NextAuthConfig } from "next-auth";

const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || "86400", 10);

export const authConfig = {
  providers: [], // The full credentials provider will be added in auth.ts
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
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  pages: {
    signIn: "/login",
  },
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "micro-account-local-auth-secret",
  trustHost: true,
} satisfies NextAuthConfig;
