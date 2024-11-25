'use client';

import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import styles from './page.module.css';

const ProductPage = dynamic(() => import('./components/ProductPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900">
        <svg 
          className="animate-spin h-12 w-12 text-gray-900" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="#e5e7eb" 
            strokeWidth="4" 
            fill="none" 
          />
          <path 
            d="M12 2C6.48 2 2 6.48 2 12" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
        </svg>
      </div>
    </div>
  ),
});

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <h1>Welcome to Datafox</h1>
        <p>Please sign in to continue</p>
      </div>
    );
  }

  return <ProductPage />;
}