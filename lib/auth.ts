import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createServiceClient } from "@/supabase/server";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const supabase = createServiceClient();

      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email)
        .single();

      if (!existing) {
        // First sign-in — temp username, user will choose their own at /setup
        const tempUsername = `user-${Date.now()}`;
        await supabase.from("users").insert({
          email: user.email,
          username: tempUsername,
          display_name: user.name ?? null,
          avatar_url: user.image ?? null,
        });
      }

      return true;
    },

    async session({ session }) {
      if (!session.user?.email) return session;

      const supabase = createServiceClient();
      const { data } = await supabase
        .from("users")
        .select("id, username, display_name, avatar_url")
        .eq("email", session.user.email)
        .single();

      if (data) {
        session.user = {
          ...session.user,
          // @ts-ignore
          id: data.id,
          username: data.username,
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          needsSetup: data.username.startsWith("user-"),
        };
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },
};
