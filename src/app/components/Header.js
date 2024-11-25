'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

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
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="https://datafox.ee/wp-content/uploads/2024/04/DATAFOX_HORISONTAALLOGO_RGB-1.png"
                alt="Datafox Logo"
                width={172}
                height={36}
                priority
                className="h-8 w-auto"
              />
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            {/* Account Manager Info */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-gray-700 font-medium text-sm">Maria Kirtsi</span>
              <span className="text-brand font-medium text-xs">Account Manager</span>
            </div>

            {/* User Section */}
            {session ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/account" 
                  className="flex items-center group hover:bg-gray-50 rounded-lg px-3 py-2 transition-all duration-200"
                >
                  <div className="flex flex-col text-right mr-3">
                    <span className="text-gray-700 text-sm font-medium group-hover:text-brand transition-colors">
                      {session.user.name}
                    </span>
                    {session.user.role === 'Admin' && (
                      <span className="text-brand text-xs font-medium">Admin</span>
                    )}
                  </div>
                  <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center group-hover:bg-brand/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </Link>
                <button
                  onClick={handleAuth}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg
                           text-sm font-medium transition-all duration-200
                           focus:outline-none focus:ring-2 focus:ring-brand/50
                           border border-gray-200 hover:border-gray-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleAuth}
                className="bg-brand hover:bg-brand/90 text-white px-4 py-2 rounded-lg
                         text-sm font-medium transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-brand/50 
                         shadow-sm hover:shadow-md"
              >
                {status === 'loading' ? '...' : 'Sign In'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
