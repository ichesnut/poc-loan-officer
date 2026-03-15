import type { NextAuthConfig } from "next-auth";

// Auth config without adapter/Prisma for use in middleware (Edge Runtime)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { role: string }).role = token.role as string;
      return session;
    },
  },
  providers: [], // Providers added in auth.ts
};
