'use client';

import { useSession } from 'next-auth/react';
import styles from './page.module.css';
import AuthGuard from '../components/AuthGuard';

export default function DebugAuthPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className={styles.container}>Loading...</div>;
  }

  if (!session) {
    return <div className={styles.container}>Please sign in to view authentication details.</div>;
  }

  return (
    <AuthGuard>
      <div className={styles.container}>
        <h1>Authentication Debug Information</h1>
        
        <section className={styles.section}>
          <h2>Session Object</h2>
          <pre className={styles.pre}>
            {JSON.stringify(session, null, 2)}
          </pre>
        </section>

        <section className={styles.section}>
          <h2>User Object</h2>
          <pre className={styles.pre}>
            {JSON.stringify(session?.user, null, 2)}
          </pre>
        </section>

        <section className={styles.section}>
          <h2>Access Token</h2>
          <pre className={styles.pre}>
            {session?.accessToken ? session.accessToken : 'No access token available'}
          </pre>
        </section>

        <section className={styles.section}>
          <h2>ID Token Claims</h2>
          <pre className={styles.pre}>
            {session?.idToken ? session.idToken : 'No ID token available'}
          </pre>
        </section>
      </div>
    </AuthGuard>
  );
}
