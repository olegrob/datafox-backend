'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cartContext';
import { useState } from 'react';

export default function Header() {
  const { data: session, status } = useSession();
  const { cartItems } = useCart();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownTimeout, setDropdownTimeout] = useState(null);

  const handleAuth = async () => {
    if (session) {
      await signOut({ callbackUrl: '/' });
    } else {
      await signIn('azure-ad', { callbackUrl: '/' });
    }
  };

  const handleDropdownEnter = (key) => {
    if (dropdownTimeout) clearTimeout(dropdownTimeout);
    setActiveDropdown(key);
  };

  const handleDropdownLeave = () => {
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 300); // 300ms delay
    setDropdownTimeout(timeout);
  };

  const dropdowns = {
    muuk: {
      label: 'Müük',
      items: [
        { href: '/offers', label: 'Pakkumised' },
        { href: '/orders', label: 'Tellimused' },
        { href: '/clients', label: 'Kliendid' },
      ]
    },
    ladu: {
      label: 'Ladu',
      items: [
        { href: '/', label: 'Products' },
        { href: '/categories', label: 'Categories' },
        { href: '/attributes', label: 'Attributes' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/garantii', label: 'Warranty' },
        { href: '/tootja', label: 'Manufacturer' },
      ]
    }
  };

  return (
    <header className="bg-[#1e1f2e] text-gray-100 sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <Image
                src="https://datafox.ee/wp-content/uploads/2024/04/DATAFOX_HORISONTAALLOGO_RGB-1.png"
                alt="Datafox Logo"
                width={172}
                height={36}
                priority
                className="h-8 w-auto brightness-0 invert"
              />
            </Link>

            {/* Navigation Links */}
            {session && (
              <nav className="hidden md:flex space-x-1">
                <Link 
                  href="/dashboard" 
                  className="px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#2a2b3d] rounded-md transition-colors"
                >
                  Dashboard
                </Link>

                {/* Dropdown Menus */}
                {Object.entries(dropdowns).map(([key, dropdown]) => (
                  <div
                    key={key}
                    className="relative"
                    onMouseEnter={() => handleDropdownEnter(key)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <button
                      className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-1
                        ${activeDropdown === key 
                          ? 'text-white bg-[#2a2b3d]' 
                          : 'text-gray-300 hover:text-white hover:bg-[#2a2b3d]'}`}
                    >
                      {dropdown.label}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Content */}
                    {activeDropdown === key && (
                      <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-[#2a2b3d] ring-1 ring-black ring-opacity-5">
                        <div className="py-1" role="menu">
                          {dropdown.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#343548]"
                              role="menuitem"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {session && (
              <Link
                href="/cart"
                className="relative p-2 hover:bg-[#2a2b3d] rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </Link>
            )}
            {session ? (
              <div className="flex items-center gap-4">
                <Link 
                  href="/account" 
                  className="flex items-center gap-2 hover:bg-[#2a2b3d] rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-medium text-gray-200">
                      {session.user.name}
                    </span>
                    {session.user.role === 'Admin' && (
                      <span className="text-xs font-medium text-blue-400">Admin</span>
                    )}
                  </div>
                  <div className="h-8 w-8 rounded-full bg-[#2a2b3d] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </Link>
                <button
                  onClick={handleAuth}
                  className="bg-[#2a2b3d] text-gray-200 px-4 py-2 rounded-lg
                           text-sm font-medium transition-all duration-200
                           hover:bg-[#343548] focus:outline-none focus:ring-2 
                           focus:ring-blue-500/30 hover:scale-[0.98]
                           active:scale-95"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleAuth}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg
                         text-sm font-medium transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-blue-500/30 
                         hover:scale-[0.98] active:scale-95"
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