'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductModal from './ProductModal';
import Filters from './Filters';
import TopBar from './TopBar';
import ProductGrid from './ProductGrid';
import Pagination from './Pagination';

export default function ProductPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showInStock, setShowInStock] = useState(true);
  const [showTax, setShowTax] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedManufacturer, setSelectedManufacturer] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState(searchParams.get('warehouse') || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warehouseCounts, setWarehouseCounts] = useState([]);
  const [manufacturerCounts, setManufacturerCounts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isManufacturersExpanded, setIsManufacturersExpanded] = useState(false);

  // Set initial search query from URL category parameter
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setSearchQuery(category);
      setDebouncedSearch(category);
    }
  }, [searchParams]);

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

      const category = searchParams.get('category');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '30',
        ...(category ? { category } : { search: debouncedSearch }),
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

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
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
        padding: '24px',
        textAlign: 'center',
        color: '#ef4444'
      }}>
        <div style={{ marginBottom: '16px' }}>Error: {error}</div>
        <button 
          onClick={fetchProducts}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: '#2563eb',
            color: 'white',
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
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', gap: '24px' }}>
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

        <div style={{ flex: 1 }}>
          <TopBar
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            inStockOnly={showInStock}
            handleInStockChange={handleStockFilter}
            totalProducts={totalProducts}
            currentPage={currentPage}
            totalPages={totalPages}
            showTax={showTax}
            setShowTax={setShowTax}
          />

          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '48px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              Loading...
            </div>
          ) : (
            <>
              <ProductGrid
                products={products}
                setSelectedProduct={setSelectedProduct}
                showTax={showTax}
              />

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={paginate}
              />
            </>
          )}

          {selectedProduct && (
            <ProductModal
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              showTax={showTax}
            />
          )}
        </div>
      </div>
    </div>
  );
}