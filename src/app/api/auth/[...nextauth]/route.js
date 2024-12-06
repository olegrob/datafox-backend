import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { getDb, closeConnection } from '@/lib/db';

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
          const db = await getDb('auth-session');
          await db.sql('SELECT 1'); // Verify connection
          return true;
        } catch (error) {
          console.error('Database connection error:', error);
          return false;
        }
      }
      return false;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.email = token.email || session.user.email;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.email = profile?.email || token.email;
      }
      return token;
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error'
  },
  events: {
    signOut: async ({ session }) => {
      if (session?.user?.email) {
        await closeConnection(session.user.email);
      }
    },
  },
};

export const authOptions = config;
const handler = NextAuth(config);

export { handler as GET, handler as POST };
