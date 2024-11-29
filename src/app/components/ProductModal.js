'use client';
import { useState, useEffect } from 'react';
import { calculateFinalPrice } from '@/lib/priceCalculations';

const ProductModal = ({ product, onClose, showTax, showMarkup, pricingRules, shippingFees }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLargeImage, setShowLargeImage] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(null);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (showLargeImage) {
          setShowLargeImage(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose, showLargeImage]);

  useEffect(() => {
    const calculatePrices = async () => {
      const price = await calculateFinalPrice(
        product,
        pricingRules,
        shippingFees
      );
      setCalculatedPrice(price);
    };

    if (showMarkup) {
      calculatePrices();
    }
  }, [product, showMarkup, pricingRules, shippingFees]);

  let imageUrls = [];
  let attributes = {};

  const calculatePriceWithTax = (price) => {
    if (!price) return 0;
    const taxRate = 0.22; // 22% tax rate
    return parseFloat(price) * (1 + taxRate);
  };

  try {
    imageUrls = product.external_image_urls ? JSON.parse(product.external_image_urls) : [];
  } catch (error) {
    console.error('Error parsing image URLs:', error);
  }

  try {
    if (product.product_attributes && typeof product.product_attributes === 'string') {
      attributes = JSON.parse(product.product_attributes);
    }
  } catch (error) {
    console.error('Error parsing product attributes:', error);
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  // Function to check if content contains HTML
  const containsHTML = (str) => {
    return /<[a-z][\s\S]*>/i.test(str);
  };

  // Function to safely render HTML or plain text
  const renderDescription = (content) => {
    if (!content) return null;
    
    if (containsHTML(content)) {
      return (
        <div 
          dangerouslySetInnerHTML={{ 
            __html: content
              .replace(/&bull;/g, '•') // Replace HTML bull entity with bullet point
              .replace(/<br\/>/g, '<br />') // Normalize br tags
          }} 
          style={{
            '& p': { marginBottom: '16px' },
            '& br': { marginBottom: '8px' },
            '& ul, & ol': { 
              paddingLeft: '20px',
              marginBottom: '16px'
            },
            '& li': { marginBottom: '8px' }
          }}
        />
      );
    }

    // For plain text, split by newlines and render paragraphs
    return content.split('\n\n').map((paragraph, index) => (
      <p key={index} style={{ 
        marginBottom: index < content.split('\n\n').length - 1 ? '16px' : '0' 
      }}>
        {paragraph}
      </p>
    ));
  };

  if (!product) return null;

  // Format warranty period
  const warrantyMonths = product.warranty_period ? parseInt(product.warranty_period.replace('L', '')) : null;
  const warrantyText = warrantyMonths ? `${warrantyMonths} months` : 'N/A';

  // Group specifications into categories
  const specifications = {
    technical: [
      { label: 'SSD Series', value: attributes['SSD series'] },
      { label: 'Capacity', value: attributes['SSD Capacity'] },
      { label: 'Interface', value: attributes['SATA 3.0'] ? 'SATA 3.0' : null },
      { label: 'Write Speed', value: attributes['Write speed'] ? `${attributes['Write speed']} MB/s` : null },
      { label: 'Read Speed', value: attributes['Read speed'] ? `${attributes['Read speed']} MB/s` : null },
      { label: 'Form Factor', value: attributes['Form Factor'] },
      { label: 'Drive Thickness', value: attributes['Drive thickness'] },
      { label: 'TBW', value: attributes['TBW'] ? `${attributes['TBW']} TB` : null },
      { label: 'MTBF', value: attributes['MTBF'] ? `${attributes['MTBF']} hours` : null },
      { label: 'Warranty', value: warrantyText },
      { label: 'Product ID', value: product.product_id },
      { label: 'GTIN13', value: product.wpsso_product_gtin13 },
      { label: 'MFR Part No', value: product.wpsso_product_mfr_part_no }
    ],
    physical: [
      { label: 'Net Weight', value: product.weight ? `${(product.weight * 1000).toFixed(0)}g` : null },
      { label: 'Dimensions (L×W×H)', value: product.length ? `${(product.length * 100).toFixed(1)} × ${(product.width * 100).toFixed(1)} × ${(product.height * 100).toFixed(1)} cm` : null },
      { label: 'Box Dimensions', value: attributes['Unit Box Length'] ? `${(parseFloat(attributes['Unit Box Length']) * 100).toFixed(1)} × ${(parseFloat(attributes['Unit Box Width']) * 100).toFixed(1)} × ${(parseFloat(attributes['Unit Box Height']) * 100).toFixed(1)} cm` : null },
      { label: 'Box Weight', value: attributes['Unit Gross Weight'] ? `${(parseFloat(attributes['Unit Gross Weight']) * 1000).toFixed(0)}g` : null },
      { label: 'Box Volume', value: attributes['Unit Brutto Volume'] ? `${(parseFloat(attributes['Unit Brutto Volume']) * 1000).toFixed(0)}L` : null }
    ],
    additional: [
      { label: 'Manufacturer', value: product.manufacturer },
      { label: 'Warehouse', value: product.warehouse },
      { label: 'Stock', value: `${product.stock} units` },
      { label: 'Category', value: product.product_category },
      { label: 'Created', value: formatDate(product.created_at) },
      { label: 'Updated', value: formatDate(product.updated_at) },
      { label: 'Vendor Homepage', value: attributes['Vendor Homepage'] }
    ]
  };

  const renderSpecifications = (specs) => {
    return specs
      .filter(spec => spec.value)
      .map(({ label, value }) => (
        <div
          key={label}
          style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}
        >
          <div style={{
            fontSize: '13px',
            color: '#6b7280',
            marginBottom: '4px'
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#111827',
            fontWeight: '500'
          }}>
            {value}
          </div>
        </div>
      ));
  };

  const formattedName = product.name.split('|').join(' • ');

  const getBasePrice = () => {
    const regularPrice = parseFloat(product.regular_price || 0);
    const salePrice = parseFloat(product.sale_price || 0);
    const hasValidSale = salePrice > 0 && salePrice < regularPrice;
    return hasValidSale ? salePrice : regularPrice;
  };

  const displayPrice = showTax 
    ? calculatePriceWithTax(getBasePrice())
    : getBasePrice();

  const calculateFinalDisplayPrice = (price) => {
    return showTax ? calculatePriceWithTax(price) : price;
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      >
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '500px 1fr',
            gap: '32px',
            marginTop: '24px'
          }}>
            {/* Image Gallery Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Main Image */}
              <div 
                style={{
                  width: '500px',
                  height: '500px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: imageUrls.length > 0 ? 'pointer' : 'default',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => imageUrls.length > 0 && setShowLargeImage(true)}
              >
                {imageUrls.length > 0 ? (
                  <img
                    src={imageUrls[currentImageIndex]}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      padding: '16px'
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    color: '#94a3b8'
                  }}>
                    <svg 
                      width="64" 
                      height="64" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      No Image Available
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery - Only show if there are images */}
              {imageUrls.length > 1 && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  padding: '8px 0'
                }}>
                  {imageUrls.map((url, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      style={{
                        width: '80px',
                        height: '80px',
                        border: currentImageIndex === index ? '2px solid #2563eb' : '1px solid #e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={url}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          padding: '4px'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#6b7280',
                    backgroundColor: '#f3f4f6',
                    padding: '4px 12px',
                    borderRadius: '6px'
                  }}>
                    {product.manufacturer}
                  </span>
                  <span style={{
                    fontSize: '16px',
                    color: '#6b7280'
                  }}>
                    ID: {product.product_id}
                  </span>
                </div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {formattedName}
                </h2>
              </div>

              {/* Price and Stock */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                padding: '24px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                {/* Price Section */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {showMarkup && calculatedPrice ? (
                    <>
                      <div style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '4px',
                        letterSpacing: '-0.02em'
                      }}>
                        €{calculateFinalDisplayPrice(calculatedPrice.finalPrice).toFixed(2)}
                        {showTax && (
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#6b7280'
                          }}>
                            (incl. VAT)
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        <div>
                          Original Price: €{calculateFinalDisplayPrice(calculatedPrice.originalPrice).toFixed(2)}
                        </div>
                        <div>
                          Markup: €{calculateFinalDisplayPrice(calculatedPrice.markupPrice - calculatedPrice.originalPrice).toFixed(2)} 
                          {calculatedPrice.appliedRule && ` (${calculatedPrice.appliedRule.markup_percentage}%)`}
                        </div>
                        <div>
                          Shipping: €{calculateFinalDisplayPrice(calculatedPrice.shippingFee).toFixed(2)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '4px',
                        letterSpacing: '-0.02em'
                      }}>
                        €{displayPrice.toFixed(2)}
                        {showTax && (
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#6b7280'
                          }}>
                            (incl. VAT)
                          </span>
                        )}
                      </div>
                      
                      {/* Show original price if there's a sale */}
                      {(() => {
                        const regularPrice = parseFloat(product.regular_price || 0);
                        const salePrice = parseFloat(product.sale_price || 0);
                        if (salePrice > 0 && salePrice < regularPrice) {
                          return (
                            <div style={{
                              fontSize: '16px',
                              color: '#ef4444',
                              textDecoration: 'line-through',
                              fontWeight: '500'
                            }}>
                              €{calculateFinalDisplayPrice(regularPrice).toFixed(2)}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                </div>

                {/* Sale Badge - only show if not showing markup */}
                {!showMarkup && (() => {
                  const regularPrice = parseFloat(product.regular_price || 0);
                  const salePrice = parseFloat(product.sale_price || 0);
                  if (salePrice > 0 && salePrice < regularPrice) {
                    const discount = Math.round((1 - salePrice / regularPrice) * 100);
                    return (
                      <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#ef4444',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Save {discount}%
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Stock and Warehouse Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '16px'
              }}>
                {/* Stock Display */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: Number(product.stock) > 0 ? '#059669' : '#dc2626',
                    border: '2px solid ${Number(product.stock) > 0 ? "#dcfce7" : "#fee2e2"}'
                  }} />
                  <span style={{
                    fontSize: '15px',
                    fontWeight: '500',
                    color: Number(product.stock) > 0 ? '#059669' : '#dc2626'
                  }}>
                    {Number(product.stock) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>

                {/* Warehouse Display */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f3f4f6',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  marginLeft: 'auto'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6b7280'
                  }}>
                    {product.warehouse}
                  </span>
                </div>
              </div>

              {/* Short Description */}
              {product.short_description && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0
                  }}>
                    Overview
                  </h3>
                  <div
                    style={{
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#374151',
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    {renderDescription(product.short_description)}
                  </div>
                </div>
              )}

              {/* Long Description */}
              {product.long_description && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0
                  }}>
                    Detailed Description
                  </h3>
                  <div
                    style={{
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#374151',
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    {renderDescription(product.long_description)}
                  </div>
                </div>
              )}

              {/* Technical Specifications */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  Technical Specifications
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '12px'
                }}>
                  {renderSpecifications(specifications.technical)}
                </div>
              </div>

              {/* Physical Specifications */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  Physical Specifications
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '12px'
                }}>
                  {renderSpecifications(specifications.physical)}
                </div>
              </div>

              {/* Additional Information */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  Additional Information
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '12px'
                }}>
                  {renderSpecifications(specifications.additional)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Large Image Overlay */}
      {showLargeImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100,
            cursor: 'pointer'
          }}
          onClick={() => setShowLargeImage(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
          >
            <img
              src={imageUrls[currentImageIndex]}
              alt={product.name}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain'
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLargeImage(false);
              }}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductModal;
