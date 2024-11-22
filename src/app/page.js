import dynamic from 'next/dynamic';

const ProductPage = dynamic(() => import('./components/ProductPage'), {
  ssr: false,
  loading: () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f9fafb',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24"
          style={{
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }}
        >
          <circle 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="#e5e7eb" 
            strokeWidth="4" 
            fill="none" 
          />
          <path 
            d="M12 2C6.48 2 2 6.48 2 12" 
            stroke="#3b82f6" 
            strokeWidth="4" 
            fill="none"
          />
        </svg>
        Loading...
      </div>
    </div>
  )
});

export default function Home() {
  return <ProductPage />;
}