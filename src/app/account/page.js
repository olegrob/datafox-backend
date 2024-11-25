'use client';

import { useSession } from 'next-auth/react';
import styles from './page.module.css';
import AuthGuard from '../components/AuthGuard';

export default function AccountPage() {
  const { data: session, status } = useSession();

  return (
    <AuthGuard>
      <div className={styles.container}>
        <div className={styles.accountCard}>
          <h1 className={styles.title}>Account Details</h1>
          
          <div className={styles.profileSection}>
            <div className={styles.profileHeader}>
              <div className={styles.avatarPlaceholder}>
                {session?.user?.name ? session.user.name[0].toUpperCase() : '?'}
              </div>
              <div className={styles.nameRole}>
                <h2 className={styles.name}>{session?.user?.name}</h2>
                <span className={`${styles.role} ${session?.user?.role === 'Admin' ? styles.adminRole : ''}`}>
                  {session?.user?.role}
                </span>
              </div>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <label>Email</label>
                <div>{session?.user?.email}</div>
              </div>
              
              <div className={styles.detailItem}>
                <label>Preferred Username</label>
                <div>{session?.user?.preferredUsername || 'Not available'}</div>
              </div>

              {session?.user?.jobTitle && (
                <div className={styles.detailItem}>
                  <label>Job Title</label>
                  <div>{session.user.jobTitle}</div>
                </div>
              )}

              {session?.user?.department && (
                <div className={styles.detailItem}>
                  <label>Department</label>
                  <div>{session.user.department}</div>
                </div>
              )}

              {session?.user?.officeLocation && (
                <div className={styles.detailItem}>
                  <label>Office Location</label>
                  <div>{session.user.officeLocation}</div>
                </div>
              )}

              <div className={styles.detailItem}>
                <label>Session Expires</label>
                <div>{session?.expires}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
