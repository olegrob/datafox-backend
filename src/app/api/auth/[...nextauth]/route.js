import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { getDb } from '@/lib/db';

// Get environment variables with fallback to next.config.js values
const AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID;
const AZURE_AD_CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET;
const AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || 'common';

// Log environment variable status (without exposing values)
console.log('Environment Variables Status:', {
  AZURE_AD_CLIENT_ID: !!AZURE_AD_CLIENT_ID,
  AZURE_AD_CLIENT_SECRET: !!AZURE_AD_CLIENT_SECRET,
  AZURE_AD_TENANT_ID: !!AZURE_AD_TENANT_ID,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL
});

if (!AZURE_AD_CLIENT_ID || !AZURE_AD_CLIENT_SECRET) {
  console.error('Missing required Azure AD environment variables');
  if (process.env.NODE_ENV === 'development') {
    throw new Error('Missing required Azure AD environment variables in development');
  }
}

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: AZURE_AD_CLIENT_ID,
      clientSecret: AZURE_AD_CLIENT_SECRET,
      tenantId: AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: 'openid profile email User.Read offline_access'
        }
      }
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      console.log('Sign In Attempt:', {
        provider: account?.provider,
        email: profile?.email || profile?.preferred_username,
        name: profile?.name
      });

      if (account?.provider === 'azure-ad') {
        const email = profile?.email || profile?.preferred_username;
        if (!email || !email.endsWith('@datafox.ee')) {
          console.warn('Access denied - Invalid email domain:', email);
          return '/auth/error?error=AccessDenied';
        }
        return true;
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        console.log('JWT Callback - New Token:', {
          provider: account.provider,
          type: account.type,
          hasAccessToken: !!account.access_token
        });

        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        console.log('Session Callback:', {
          email: session.user.email,
          hasAccessToken: !!token.accessToken
        });

        session.accessToken = token.accessToken;
        session.idToken = token.idToken;
        session.provider = token.provider;

        try {
          const db = await getDb();
          const [user] = await db.execute(
            'SELECT * FROM users_table WHERE email = ?',
            [session.user.email]
          );

          if (!user) {
            console.log('Creating new user:', session.user.email);
            const result = await db.execute(
              `INSERT INTO users_table (email, name, azure_id) 
               VALUES (?, ?, ?)`,
              [session.user.email, session.user.name, token.sub]
            );
            session.user.id = result.lastID;
            session.user.role = 'Regular';
          } else {
            console.log('User found:', {
              email: user.email,
              role: user.role
            });
            session.user.id = user.id;
            session.user.role = user.role;
          }
        } catch (error) {
          console.error('Database error in session callback:', error);
          // Don't throw error, just log it
          session.user.role = 'Regular';
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error'
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error: (code, ...message) => {
      console.error('NextAuth Error:', { code, message });
    },
    warn: (code, ...message) => {
      console.warn('NextAuth Warning:', { code, message });
    },
    debug: (code, ...message) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', { code, message });
      }
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
