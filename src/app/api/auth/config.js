import AzureADProvider from 'next-auth/providers/azure-ad';
import { getDb } from '@/lib/db';

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'azure-ad') {
        try {
          await getDb();
          return true;
        } catch (error) {
          console.error('Database connection error:', error);
          return false;
        }
      }
      return false;
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user;
        session.accessToken = token.accessToken;
        session.error = token.error;
      }
      return session;
    },
    async jwt({ token, account, user, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.user = user;
        token.profile = profile;
      }
      return token;
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error'
  },
  debug: process.env.NODE_ENV === 'development',
};
