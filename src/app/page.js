'use client';
import { useState, useEffect, useCallback } from 'react';
import ProductModal from './components/ProductModal';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showInStock, setShowInStock] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedManufacturer, setSelectedManufacturer] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warehouseCounts, setWarehouseCounts] = useState([]);
  const [manufacturerCounts, setManufacturerCounts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isManufacturersExpanded, setIsManufacturersExpanded] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, sortBy, showInStock, priceRange, selectedManufacturer, selectedWarehouse, currentPage]);

  const fetchProducts = async () => {
    try {
      setError(null);

      const params = new URLSearchParams({
        page: currentPage,
        limit: 30,
        search: debouncedSearch,
        sortBy,
        warehouse: selectedWarehouse,
        manufacturer: selectedManufacturer,
        showInStock: showInStock,
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max })
      });

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotalProducts(data.total);
      setWarehouseCounts(data.warehouseCounts);
      setManufacturerCounts(data.manufacturerCounts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to load products');
      setProducts([]);
      setTotalPages(0);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleSort = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleStockFilter = () => {
    setShowInStock(prev => !prev);
    setCurrentPage(1);
  };

  const handlePriceChange = (type, value) => {
    setPriceRange(prev => ({
      ...prev,
      [type]: value
    }));
    setCurrentPage(1);
  };

  const handleWarehouseChange = (value) => {
    setSelectedWarehouse(value);
    setCurrentPage(1);
  };

  const handleManufacturerChange = (value) => {
    setSelectedManufacturer(value);
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f9fafb',
        color: '#ef4444',
        gap: '12px'
      }}>
        <div>Error: {error}</div>
        <button 
          onClick={fetchProducts}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: '#f9fafb',
      display: 'flex',
      gap: '24px',
      minHeight: '100vh'
    }}>
      {/* Left Sidebar */}
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

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top Bar with Search and Filters */}
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
                transition: 'border-color 0.2s',
                '::placeholder': {
                  color: '#9ca3af'
                },
                ':focus': {
                  borderColor: '#2563eb',
                  boxShadow: '0 0 0 1px rgba(37, 99, 235, 0.1)'
                }
              }}
            />
          </div>

          {/* Products Count, Availability and Sort */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <span style={{
              color: '#111827',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {totalProducts} products found
            </span>
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

        {/* Products Count and Page Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <span style={{
            color: '#111827',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {totalProducts} products found
          </span>
          <span style={{
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Products Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginTop: '24px'
        }}>
          {products.map(product => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Product Image */}
              <div style={{
                aspectRatio: '1',
                backgroundColor: '#f8fafc',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {(() => {
                  try {
                    const images = JSON.parse(product.external_image_urls || '[]');
                    return images[0] ? (
                      <img
                        src={images[0]}
                        alt={product.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23CBD5E1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M20.4 14.5L16 10 4 20"/></svg>';
                        }}
                      />
                    ) : (
                      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M20.4 14.5L16 10 4 20"/>
                      </svg>
                    );
                  } catch (error) {
                    return (
                      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M20.4 14.5L16 10 4 20"/>
                      </svg>
                    );
                  }
                })()}
              </div>

              {/* Product Info */}
              <div style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1
              }}>
                {/* Manufacturer */}
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  {product.manufacturer}
                </div>

                {/* Product Name */}
                <div style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#111827',
                  display: '-webkit-box',
                  WebkitLineClamp: '2',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  flex: 1
                }}>
                  {product.name}
                </div>

                {/* Price and Stock */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginTop: 'auto'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      €{parseFloat(product.regular_price).toFixed(2)}
                    </div>
                    {product.sale_price && (
                      <div style={{
                        fontSize: '14px',
                        color: '#ef4444',
                        textDecoration: 'line-through'
                      }}>
                        €{parseFloat(product.sale_price).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: Number(product.stock) > 0 ? '#059669' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'currentColor'
                    }}></span>
                    {Number(product.stock) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Product Modal */}
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '32px',
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            flexWrap: 'wrap'
          }}>
            {/* Previous button */}
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                color: currentPage === 1 ? '#9ca3af' : '#111827',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Previous
            </button>

            {/* Page numbers */}
            <div style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {(() => {
                const pages = [];
                let startPage = Math.max(1, currentPage - 2);
                let endPage = Math.min(totalPages, startPage + 4);
                
                if (endPage - startPage < 4) {
                  startPage = Math.max(1, endPage - 4);
                }

                // First page
                if (startPage > 1) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => paginate(1)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: 1 === currentPage ? '#2563eb' : 'white',
                        color: 1 === currentPage ? 'white' : '#111827',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        minWidth: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      1
                    </button>
                  );
                  
                  if (startPage > 2) {
                    pages.push(
                      <span key="dots1" style={{ color: '#6b7280' }}>...</span>
                    );
                  }
                }

                // Page numbers
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => paginate(i)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: i === currentPage ? '#2563eb' : 'white',
                        color: i === currentPage ? 'white' : '#111827',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        minWidth: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {i}
                    </button>
                  );
                }

                // Last page
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="dots2" style={{ color: '#6b7280' }}>...</span>
                    );
                  }
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => paginate(totalPages)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: totalPages === currentPage ? '#2563eb' : 'white',
                        color: totalPages === currentPage ? 'white' : '#111827',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        minWidth: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pages;
              })()}
            </div>

            {/* Next button */}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                color: currentPage === totalPages ? '#9ca3af' : '#111827',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Next
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          Loading...
        </div>
      </div>
    );
  }
}
