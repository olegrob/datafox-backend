'use client';

export default function Filters({
  selectedWarehouse,
  handleWarehouseChange,
  warehouseCounts,
  selectedManufacturer,
  handleManufacturerChange,
  manufacturerCounts,
  isManufacturersExpanded,
  setIsManufacturersExpanded,
  sortBy,
  handleSort,
  priceRange,
  handlePriceChange
}) {
  return (
    <div style={{
      width: '280px',
      flexShrink: 0,
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      position: 'sticky',
      top: '20px',
      height: 'fit-content',
      maxHeight: 'calc(100vh - 40px)',
      overflowY: 'auto',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Warehouses Section */}
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600',
          marginBottom: '16px',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22V12h6v10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Warehouses
        </h3>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px',
          backgroundColor: '#f9fafb',
          padding: '12px',
          borderRadius: '8px'
        }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: selectedWarehouse === 'all' ? '#e5e7eb' : 'transparent',
            transition: 'all 0.2s'
          }}>
            <input
              type="radio"
              name="warehouse"
              value="all"
              checked={selectedWarehouse === 'all'}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              style={{ accentColor: '#2563eb' }}
            />
            <span style={{
              color: selectedWarehouse === 'all' ? '#111827' : '#6b7280',
              fontWeight: selectedWarehouse === 'all' ? '500' : '400'
            }}>
              All Warehouses ({warehouseCounts.reduce((sum, w) => sum + w.count, 0)})
            </span>
          </label>
          {warehouseCounts.map(({ warehouse, count }) => (
            <label
              key={warehouse}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: selectedWarehouse === warehouse ? '#e5e7eb' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <input
                type="radio"
                name="warehouse"
                value={warehouse}
                checked={selectedWarehouse === warehouse}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                style={{ accentColor: '#2563eb' }}
              />
              <span style={{
                color: selectedWarehouse === warehouse ? '#111827' : '#6b7280',
                fontWeight: selectedWarehouse === warehouse ? '500' : '400'
              }}>
                {warehouse} ({count})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Manufacturers Section */}
      <div>
        <h3 
          onClick={() => setIsManufacturersExpanded(!isManufacturersExpanded)}
          style={{ 
            fontSize: '16px', 
            fontWeight: '600',
            marginBottom: isManufacturersExpanded ? '16px' : '0',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2L2 7l10 5 10-5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22V12h6v10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Manufacturers
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            style={{
              marginLeft: 'auto',
              transform: isManufacturersExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </h3>
        <div style={{ 
          display: isManufacturersExpanded ? 'flex' : 'none', 
          flexDirection: 'column', 
          gap: '10px',
          backgroundColor: '#f9fafb',
          padding: '12px',
          borderRadius: '8px'
        }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: selectedManufacturer === 'all' ? '#e5e7eb' : 'transparent',
            transition: 'all 0.2s'
          }}>
            <input
              type="radio"
              name="manufacturer"
              value="all"
              checked={selectedManufacturer === 'all'}
              onChange={(e) => handleManufacturerChange(e.target.value)}
              style={{ accentColor: '#2563eb' }}
            />
            <span style={{
              color: selectedManufacturer === 'all' ? '#111827' : '#6b7280',
              fontWeight: selectedManufacturer === 'all' ? '500' : '400'
            }}>
              All Manufacturers ({manufacturerCounts.reduce((sum, m) => sum + m.count, 0)})
            </span>
          </label>
          {manufacturerCounts.map(({ manufacturer, count }) => (
            <label
              key={manufacturer}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: selectedManufacturer === manufacturer ? '#e5e7eb' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <input
                type="radio"
                name="manufacturer"
                value={manufacturer}
                checked={selectedManufacturer === manufacturer}
                onChange={(e) => handleManufacturerChange(e.target.value)}
                style={{ accentColor: '#2563eb' }}
              />
              <span style={{
                color: selectedManufacturer === manufacturer ? '#111827' : '#6b7280',
                fontWeight: selectedManufacturer === manufacturer ? '500' : '400'
              }}>
                {manufacturer} ({count})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort by */}
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600',
          marginBottom: '16px',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6h18M6 12h12M9 18h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sort by
        </h3>
        <select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            fontWeight: '500'
          }}
        >
          <option value="default">Default</option>
          <option value="price-high">Price: High to Low</option>
          <option value="price-low">Price: Low to High</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>

      {/* Price Range */}
      <div>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600',
          marginBottom: '16px',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Price Range
        </h3>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                color: '#374151',
                fontWeight: '500'
              }}
            />
          </div>
          <span style={{ 
            color: '#6b7280',
            fontWeight: '500'
          }}>-</span>
          <div style={{ flex: 1 }}>
            <input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                color: '#374151',
                fontWeight: '500'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}