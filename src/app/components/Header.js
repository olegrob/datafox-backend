'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

export default function Header() {
  const { data: session, status } = useSession();

  const handleAuth = async () => {
    if (session) {
      await signOut({ callbackUrl: '/' });
    } else {
      await signIn('azure-ad', { callbackUrl: '/' });
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <Link href="/" className={styles.logo}>
          <Image
            src="https://datafox.ee/wp-content/uploads/2024/04/DATAFOX_HORISONTAALLOGO_RGB-1.png"
            alt="Datafox Logo"
            width={172}
            height={36}
            priority
          />
        </Link>
      </div>

      <div className={styles.accountManager}>
        <div className={styles.managerName}>Maria Kirtsi</div>
        <div className={styles.managerTitle}>Account Manager</div>
      </div>

      <nav className={styles.navigation}>
        {/* Navigation pages will be added here */}
      </nav>

      <div className={styles.rightSection}>
        {session ? (
          <>
            <Link href="/account" className={styles.accountLink}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{session.user.name}</span>
                {session.user.role === 'Admin' && (
                  <span className={styles.adminBadge}>Admin</span>
                )}
              </div>
            </Link>
            <button 
              className={styles.accountButton}
              onClick={handleAuth}
            >
              Sign Out
            </button>
          </>
        ) : (
          <button 
            className={styles.accountButton}
            onClick={handleAuth}
          >
            {status === 'loading' ? '...' : 'Account'}
          </button>
        )}
      </div>
    </header>
  );
}
