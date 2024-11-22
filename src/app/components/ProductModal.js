'use client';
import { useState } from 'react';

const ProductModal = ({ product, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  let imageUrls = [];
  let attributes = {};
  
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

  return (
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
      zIndex: 50,
      padding: '20px'
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
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
          padding: '32px',
          display: 'grid',
          gridTemplateColumns: '400px 1fr',
          gap: '32px'
        }}>
          {/* Left Column - Gallery */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Main Image */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '24px',
              height: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <img
                src={imageUrls[currentImageIndex] || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23CBD5E1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M20.4 14.5L16 10 4 20"/></svg>'}
                alt={formattedName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
              
              {/* Navigation Arrows */}
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1));
                    }}
                    style={{
                      position: 'absolute',
                      left: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0));
                    }}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {imageUrls.length > 1 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px'
              }}>
                {imageUrls.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    style={{
                      padding: '8px',
                      border: `2px solid ${currentImageIndex === index ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={image}
                      alt={`${formattedName} - ${index + 1}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
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
              alignItems: 'center',
              gap: '24px',
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px'
              }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  €{parseFloat(product.regular_price).toFixed(2)}
                </span>
                {product.sale_price && (
                  <span style={{
                    fontSize: '20px',
                    color: '#ef4444',
                    textDecoration: 'line-through'
                  }}>
                    €{parseFloat(product.sale_price).toFixed(2)}
                  </span>
                )}
              </div>
              <div style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{
                  fontSize: '16px',
                  color: Number(product.stock) > 0 ? '#059669' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {Number(product.stock) > 0 
                      ? <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      : <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    }
                  </svg>
                  {Number(product.stock) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
                <span style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  backgroundColor: '#f3f4f6',
                  padding: '4px 12px',
                  borderRadius: '6px'
                }}>
                  {product.warehouse}
                </span>
              </div>
            </div>

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

            {/* Description */}
            {attributes.Description && (
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
                  Description
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
                  dangerouslySetInnerHTML={{ __html: attributes.Description }}
                />
              </div>
            )}
            {/* Description */}
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
                  Description
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
                  dangerouslySetInnerHTML={{ __html: product.long_description }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
