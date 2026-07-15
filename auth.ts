import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Single-password auth for the whole hub (one user).
 * Everything is gated except the public portfolio (/me), the login page,
 * and the auth API. Set APP_PASSWORD + AUTH_SECRET in the environment.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Password",
      credentials: { password: { label: "Password", type: "password" } },
      authorize: (creds) => {
        const expected = process.env.APP_PASSWORD;
        if (expected && creds?.password === expected) {
          return { id: "owner", name: "Owner" };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    authorized: ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      // Public surfaces: login + the recruiter-facing portfolio.
      if (pathname.startsWith("/login")) return true;
      if (pathname === "/me" || pathname.startsWith("/me/")) return true;
      return !!auth?.user;
    },
  },
});
