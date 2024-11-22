'use client';

export default function TopBar({ 
  searchQuery, 
  handleSearch, 
  showInStock, 
  handleStockFilter, 
  sortBy, 
  handleSort 
}) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '24px',
      position: 'sticky',
      top: '20px',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Search Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
      }}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleSearch}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '14px',
            backgroundColor: 'white',
            color: '#111827',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
        />
      </div>

      {/* Availability and Sort */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <button
          onClick={handleStockFilter}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            backgroundColor: showInStock ? '#2563eb' : 'white',
            color: showInStock ? 'white' : '#374151',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            fontWeight: '500',
            boxShadow: showInStock ? '0 2px 4px rgba(37, 99, 235, 0.1)' : 'none'
          }}
        >
          <div style={{
            width: '16px',
            height: '16px',
            border: showInStock ? '2px solid white' : '2px solid #374151',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}>
            {showInStock && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white">
                <path d="M20 6L9 17l-5-5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          In Stock Only
        </button>
        <select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            color: '#374151'
          }}
        >
          <option value="default">Sort by: Default</option>
          <option value="price-high">Sort by: Price High to Low</option>
          <option value="price-low">Sort by: Price Low to High</option>
          <option value="name-asc">Sort by: Name A to Z</option>
          <option value="name-desc">Sort by: Name Z to A</option>
        </select>
      </div>
    </div>
  );
}