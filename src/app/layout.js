import './globals.css';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from './providers';
import Header from './components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Datafox',
  description: 'Your data management solution',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <Header />
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}