'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductModal from './ProductModal';
import Filters from './Filters';
import TopBar from './TopBar';
import ProductGrid from './ProductGrid';
import Pagination from './Pagination';

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showInStock, setShowInStock] = useState(false);
  const [showTax, setShowTax] = useState(false);
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
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '30',
        search: debouncedSearch,
        sortBy,
        warehouse: selectedWarehouse,
        manufacturer: selectedManufacturer,
        showInStock: showInStock.toString(),
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max })
      });

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 0);
      setTotalProducts(data.total || 0);
      setWarehouseCounts(data.warehouseCounts || []);
      setManufacturerCounts(data.manufacturerCounts || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to load products');
      setProducts([]);
      setTotalPages(0);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedManufacturer, selectedWarehouse, showInStock, sortBy, priceRange]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
      <div className="error-container">
        <div>Error: {error}</div>
        <button onClick={fetchProducts}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="product-page">
      <Filters
        selectedWarehouse={selectedWarehouse}
        handleWarehouseChange={handleWarehouseChange}
        warehouseCounts={warehouseCounts}
        selectedManufacturer={selectedManufacturer}
        handleManufacturerChange={handleManufacturerChange}
        manufacturerCounts={manufacturerCounts}
        isManufacturersExpanded={isManufacturersExpanded}
        setIsManufacturersExpanded={setIsManufacturersExpanded}
        sortBy={sortBy}
        handleSort={handleSort}
        priceRange={priceRange}
        handlePriceChange={handlePriceChange}
      />

      <div className="main-content">
        <TopBar
          searchQuery={searchQuery}
          handleSearch={handleSearch}
          showInStock={showInStock}
          handleStockFilter={handleStockFilter}
          sortBy={sortBy}
          handleSort={handleSort}
          totalProducts={totalProducts}
        />

        {loading ? (
          <div className="loading-overlay">Loading...</div>
        ) : (
          <>
            <div className="page-info">
              <span>{totalProducts} products found</span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <button
                  onClick={() => setShowTax(prev => !prev)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: showTax ? '#2563eb' : 'white',
                    color: showTax ? 'white' : '#374151',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  KM {showTax ? 'ON' : 'OFF'}
                </button>
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>

            <ProductGrid
              products={products}
              setSelectedProduct={setSelectedProduct}
              showTax={showTax}
            />

            {selectedProduct && (
              <ProductModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                showTax={showTax}
              />
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              paginate={paginate}
            />
          </>
        )}
      </div>
    </div>
  );
}