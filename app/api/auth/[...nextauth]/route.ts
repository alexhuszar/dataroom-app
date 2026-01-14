import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { userStore } from "@/lib/server/userStore";
import { hasPasswordBcrypt, verifyPassword } from "@/lib/utils/password";

const providers = [
  CredentialsProvider({
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      name: { label: "Name", type: "text" },
      mode: { label: "Mode", type: "text" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password required");
      }

      const { email, password, mode, name } = credentials;

      if (mode === "signup") {
        const existingUser = await userStore.getUserByEmail(email);
        if (existingUser) {
          throw new Error("User already exists");
        }

        const passwordHash = await hasPasswordBcrypt(password);
        const user = await userStore.createUser({
          email,
          name: name || email.split('@')[0],
          passwordHash,
          provider: 'credentials'
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          provider: 'credentials'
        };
      } else {
        const user = await userStore.getUserByEmail(email);
        if (!user) {
          throw new Error("Invalid credentials");
        }

        if (user.provider !== 'credentials') {
          throw new Error(`This account uses ${user.provider} sign-in. Please use that method instead.`);
        }

        if (!user.passwordHash) {
          throw new Error("No password set for this account");
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          provider: 'credentials'
        };
      }
    }
  }),
];

// Add Google OAuth provider only if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        
        const existingUser = await userStore.getUserByEmail(user.email!);

        if (!existingUser) {
          const newUser = await userStore.createUser({
            email: user.email!,
            name: user.name || user.email!.split('@')[0],
            provider: 'google'
          });

          user.id = newUser.id;
        } else {
          if (existingUser.provider === 'credentials') {
            throw new Error("This email is already registered with password. Please sign in with your password.");
          }
          user.id = existingUser.id;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.provider = ((user as { provider?: string }).provider) || account?.provider || 'credentials';
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.provider = token.provider as string;
      }

        return session;
    }
  },

  session: {
    strategy: "jwt",
    maxAge: 1 * 24 * 60 * 60, // 1 day
  },

  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
