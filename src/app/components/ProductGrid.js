'use client';

import { useState, useEffect } from 'react';
import { calculateFinalPrice } from '@/lib/priceCalculations';

export default function ProductGrid({ products, setSelectedProduct, showTax = false, showMarkup = false, pricingRules = [], shippingFees = [] }) {
  const [calculatedPrices, setCalculatedPrices] = useState({});

  useEffect(() => {
    const calculatePrices = async () => {
      const prices = {};
      for (const product of products) {
        prices[product.id] = await calculateFinalPrice(
          product,
          pricingRules,
          shippingFees
        );
      }
      setCalculatedPrices(prices);
    };

    if (showMarkup) {
      calculatePrices();
    }
  }, [products, showMarkup, pricingRules, shippingFees]);

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
        {/* ... existing "no products" content ... */}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {products.map(product => {
        const calculatedPrice = showMarkup && calculatedPrices[product.id];
        const regularPrice = parseFloat(product.regular_price || 0);
        const salePrice = parseFloat(product.sale_price || 0);
        const hasValidSale = salePrice > 0 && salePrice < regularPrice;
        
        // Determine base price before tax
        let basePrice = hasValidSale ? salePrice : regularPrice;
        if (calculatedPrice) {
          basePrice = calculatedPrice.finalPrice;
        }

        // Apply tax if needed
        const displayPrice = showTax ? calculatePriceWithTax(basePrice) : basePrice;

        return (
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
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '100%'
            }}>
              {(() => {
                try {
                  const images = JSON.parse(product.external_image_urls || '[]');
                  return images[0] ? (
                    <img
                      src={images[0]}
                      alt={product.name}
                      style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        right: '16px',
                        bottom: '16px',
                        width: 'calc(100% - 32px)',
                        height: 'calc(100% - 32px)',
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
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
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
                  padding: '4px 8px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '9999px',
                  color: '#6b7280'
                }}>
                  {product.warehouse}
                </div>
              </div>

              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
                display: '-webkit-box',
                WebkitLineClamp: '2',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.4'
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
                  {/* Final Price */}
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    €{displayPrice.toFixed(2)}
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

                  {/* Original Price (if markup or sale) */}
                  {(calculatedPrice || (hasValidSale && !calculatedPrice)) && (
                    <div style={{
                      fontSize: '14px',
                      color: '#ef4444',
                      textDecoration: 'line-through'
                    }}>
                      €{showTax
                        ? calculatePriceWithTax(regularPrice).toFixed(2)
                        : regularPrice.toFixed(2)
                      }
                    </div>
                  )}

                  {/* Markup and Shipping Details */}
                  {calculatedPrice && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      <div>Markup: €{(calculatedPrice.markupPrice - calculatedPrice.originalPrice).toFixed(2)} ({calculatedPrice.appliedRule?.markup_percentage}%)</div>
                      <div>Shipping: €{calculatedPrice.shippingFee}</div>
                    </div>
                  )}
                </div>

                {/* Stock Status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: Number(product.stock) > 0 ? '#059669' : '#dc2626'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'currentColor'
                  }} />
                  {Number(product.stock) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}