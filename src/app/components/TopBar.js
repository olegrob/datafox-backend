'use client';

export default function TopBar({ 
  searchQuery, 
  handleSearch, 
  inStockOnly, 
  handleInStockChange, 
  totalProducts,
  currentPage,
  totalPages,
  showTax,
  setShowTax
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Search Input */}
        <div style={{ 
          position: 'relative',
          flex: 1 
        }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }}
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search products..."
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              backgroundColor: '#f9fafb',
              color: '#374151'
            }}
          />
        </div>

        {/* In Stock Filter */}
        <label style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          cursor: 'pointer',
          userSelect: 'none',
          color: '#374151',
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: inStockOnly ? '#f3f4f6' : 'transparent',
          border: '1px solid #e5e7eb'
        }}>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => handleInStockChange(e.target.checked)}
            style={{ accentColor: '#2563eb' }}
          />
          In Stock Only
        </label>
      </div>

      {/* Product Count and Page Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '0 8px',
        color: '#6b7280',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        <div>
          {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
        </div>
        <div style={{ 
          width: '4px', 
          height: '4px', 
          backgroundColor: 'currentColor', 
          borderRadius: '50%' 
        }} />
        <button
          onClick={() => setShowTax(prev => !prev)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            backgroundColor: showTax ? '#2563eb' : 'white',
            color: showTax ? 'white' : '#374151',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          KM {showTax ? 'ON' : 'OFF'}
        </button>
        <div style={{ 
          width: '4px', 
          height: '4px', 
          backgroundColor: 'currentColor', 
          borderRadius: '50%' 
        }} />
        <div>
          Page {currentPage} of {totalPages}
        </div>
      </div>
    </div>
  );
}