'use client';

export default function ProductGrid({ products, setSelectedProduct, showTax = false }) {
  const calculatePriceWithTax = (price) => {
    if (!price) return 0;
    const taxRate = 0.22; // 22% tax rate
    return parseFloat(price) * (1 + taxRate);
  };

  if (!products || products.length === 0) {
    return (
      <div style={{
        width: '100%',
        textAlign: 'center',
        padding: '48px 24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <svg 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
          style={{
            margin: '0 auto 16px',
            color: '#9ca3af'
          }}
        >
          <path d="M3 3h18v18H3zM12 8v8M8 12h8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '8px'
        }}>
          No Products Found
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '24px',
      marginBottom: '24px'
    }}>
      {products.map(product => (
        <div
          key={product.id}
          onClick={() => setSelectedProduct?.(product)}
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
            justifyContent: 'center',
            width: '100%',
            height: '200px'
          }}>
            {(() => {
              try {
                const images = JSON.parse(product.external_image_urls || '[]');
                return images[0] ? (
                  <img
                    src={images[0]}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      padding: '8px'
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
            {/* Manufacturer and Warehouse */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {product.manufacturer}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {product.warehouse}
              </div>
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
              flex: 1,
              lineHeight: '1.5'
            }}>
              {product.name.split('|').map(part => part.trim()).join(' • ')}
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
                {/* Regular Price */}
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  €{showTax 
                    ? calculatePriceWithTax(product.sale_price || product.regular_price).toFixed(2)
                    : parseFloat(product.sale_price || product.regular_price).toFixed(2)
                  }
                  {showTax && (
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginLeft: '4px'
                    }}>
                      with VAT
                    </span>
                  )}
                </div>
                {/* Show original price if there's a sale price */}
                {product.sale_price && product.regular_price && parseFloat(product.sale_price) !== parseFloat(product.regular_price) && (
                  <div style={{
                    fontSize: '14px',
                    color: '#ef4444',
                    textDecoration: 'line-through'
                  }}>
                    €{showTax
                      ? calculatePriceWithTax(product.regular_price).toFixed(2)
                      : parseFloat(product.regular_price).toFixed(2)
                    }
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
  );
}