'use client';

import { useSession } from 'next-auth/react';
import TresoorConnection from '@/app/components/TresoorConnection';

export default function AccountPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please sign in to access this page.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Account Settings</h1>
      
      {/* Account Details Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account Details</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">Name</label>
            <div className="font-medium">{session.user.name}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <div className="font-medium">{session.user.email}</div>
          </div>
          {session.user.role && (
            <div>
              <label className="text-sm text-gray-500">Role</label>
              <div className="font-medium">{session.user.role}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tresoor Connection Section */}
      <TresoorConnection />
    </div>
  );
}
