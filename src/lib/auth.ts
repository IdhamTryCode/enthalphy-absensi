import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAdmin, isEmailAllowed } from "./env";

const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ profile }) {
      return isEmailAllowed(profile?.email);
    },
    async jwt({ token }) {
      token.isAdmin = isAdmin(token.email);
      return token;
    },
    async session({ session, token }) {
      session.user.isAdmin = Boolean(token.isAdmin);
      return session;
    },
  },
});

export const { GET, POST } = handlers;
export { auth, signIn, signOut };
