import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { getDb } from '@/lib/db';

const config = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email"
        }
      }
    })
  ],
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
      session.accessToken = token.accessToken;
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error'
  }
};

export const authOptions = config;
const handler = NextAuth(config);

export { handler as GET, handler as POST };
