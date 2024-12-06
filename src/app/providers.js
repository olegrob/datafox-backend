'use client';

import { SessionProvider } from 'next-auth/react';

export function NextAuthProvider({ children }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch session when window gains focus
    >
      {children}
    </SessionProvider>
  );
}
