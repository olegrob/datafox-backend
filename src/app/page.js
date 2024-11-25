import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/config';
import ProductPage from './components/ProductPage';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex">
        {/* Left side */}
        <div className="w-1/2 flex items-center justify-center p-12">
          <div className="max-w-md">
            <div className="mb-8">
              <span className="text-brand font-bold text-4xl">Data</span>
              <span className="text-white font-bold text-4xl">fox</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Manage Your Products<br />with Confidence
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Streamline your product management workflow with our powerful and intuitive platform
            </p>
            <form action="/api/auth/signin" method="POST">
              <button
                type="submit"
                className="w-full bg-brand text-white px-8 py-4 rounded-lg font-semibold
                         text-lg shadow-lg shadow-brand/30 hover:bg-brand/90 
                         focus:outline-none focus:ring-2 focus:ring-brand/50 
                         focus:ring-offset-2 focus:ring-offset-gray-900 
                         transform transition-all duration-200 hover:scale-[1.02]"
              >
                Sign in with Microsoft
              </button>
            </form>
          </div>
        </div>

        {/* Right side */}
        <div className="w-1/2 flex items-center justify-center p-12 relative">
          <div className="absolute inset-0 bg-brand/10 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-lg">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-brand/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-brand/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-brand/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            <div className="relative">
              <div className="p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-lg bg-white/10 animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ProductPage />;
}