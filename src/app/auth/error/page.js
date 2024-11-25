'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import styles from './page.module.css';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  let errorTitle = 'Authentication Error';
  let errorMessage = 'An error occurred during authentication. Please try again or contact support if the problem persists.';

  // Customize error message based on error type
  if (error?.includes('Only @datafox.ee email addresses are allowed')) {
    errorTitle = 'Access Denied';
    errorMessage = 'This application is only available for @datafox.ee email addresses. Please sign in with your Datafox account.';
  }

  return (
    <div className={styles.container}>
      <div className={styles.errorCard}>
        <h1 className={styles.title}>{errorTitle}</h1>
        <p className={styles.message}>{errorMessage}</p>
        <div className={styles.buttonContainer}>
          <Link href="/" className={styles.button}>
            Try Again
          </Link>
          <a href="mailto:support@datafox.ee" className={styles.supportButton}>
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
