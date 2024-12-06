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
    maxAge: 0 // Session expires when browser closes
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
      }
      return session;
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.user = user;
      }
      return token;
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error'
  }
};
