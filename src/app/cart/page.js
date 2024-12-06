'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cartContext';
import { useSession } from 'next-auth/react';
import { calculateFinalPrice } from '@/lib/priceCalculations';
import { useRouter } from 'next/navigation';
import ProductModal from '@/app/components/ProductModal';
import KmToggle from '@/app/components/KmToggle';

export default function CartPage() {
  const { data: session } = useSession();
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const [showMarkup, setShowMarkup] = useState(true);
  const [pricingRules, setPricingRules] = useState([]);
  const [shippingFees, setShippingFees] = useState([]);
  const router = useRouter();
  const [total, setTotal] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showTax, setShowTax] = useState(true);

  // Fetch pricing rules and shipping fees when markup is enabled
  useEffect(() => {
    if (showMarkup) {
      fetchPricingRules();
      fetchShippingFees();
    }
  }, [showMarkup]);

  // Add this effect to calculate totals when needed
  useEffect(() => {
    const updateTotal = async () => {
      const calculatedTotal = await calculateTotals();
      setTotal(calculatedTotal);
    };
    updateTotal();
  }, [cartItems, showMarkup, showTax]); // Recalculate when these change

  const fetchPricingRules = async () => {
    try {
      const response = await fetch('/pricing/api/rules');
      if (!response.ok) throw new Error('Failed to fetch rules');
      const data = await response.json();
      setPricingRules(data.rules);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchShippingFees = async () => {
    try {
      const response = await fetch('/pricing/api/shipping');
      if (!response.ok) throw new Error('Failed to fetch shipping fees');
      const data = await response.json();
      setShippingFees(data.fees);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const calculateTotals = async () => {
    if (!showMarkup) {
      return cartItems.reduce((total, item) => {
        const price = parseFloat(item.regular_price);
        const withTax = showTax ? price * 1.22 : price; // Add 22% VAT if showTax is true
        return total + (withTax * item.quantity);
      }, 0);
    }

    let total = 0;
    for (const item of cartItems) {
      const calculation = await calculateFinalPrice(item, pricingRules, shippingFees);
      const finalPrice = showTax ? calculation.finalPrice * 1.22 : calculation.finalPrice;
      total += finalPrice * item.quantity;
    }
    return total;
  };

  const handleCreateOffer = async () => {
    try {
      const total = await calculateTotals();
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Offer - ${new Date().toLocaleDateString()}`,
          products: cartItems,
          totalPrice: total,
          markupEnabled: showMarkup,
          shippingEnabled: showMarkup
        }),
      });

      if (!response.ok) throw new Error('Failed to create offer');
      const data = await response.json();
      
      // Redirect to the new offer
      router.push(`/offers/${data.offerId}`);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Group items by warehouse
  const groupedItems = cartItems.reduce((groups, item) => {
    const warehouse = item.warehouse || 'Unknown';
    if (!groups[warehouse]) {
      groups[warehouse] = [];
    }
    groups[warehouse].push(item);
    return groups;
  }, {});

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your cart</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-500 mt-1">{cartItems.length} items</p>
        </div>
        <div className="flex items-center gap-4">
          <KmToggle showTax={showTax} setShowTax={setShowTax} />
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showMarkup}
              onChange={(e) => setShowMarkup(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span>Show Markup + Shipping</span>
          </label>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear Cart
            </button>
          )}
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Your cart is empty</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Delivery Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Delivery Information</span>
            </div>
            <p className="text-sm text-blue-600">
              Your order will be delivered in {Object.keys(groupedItems).length} package{Object.keys(groupedItems).length > 1 ? 's' : ''} 
              from different warehouses
            </p>
          </div>

          {/* Packages */}
          {Object.entries(groupedItems).map(([warehouse, items], index) => (
            <div key={warehouse} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Package Header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Package {index + 1} of {Object.keys(groupedItems).length}</div>
                    <div className="font-medium text-gray-900">Shipping from {warehouse}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {items.length} item{items.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Package Items */}
              <div className="divide-y">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    showTax={showTax}
                    showMarkup={showMarkup}
                    pricingRules={pricingRules}
                    shippingFees={shippingFees}
                    onRemove={removeFromCart}
                    onUpdateQuantity={updateQuantity}
                    onSelect={setSelectedProduct}
                  />
                ))}
              </div>
            </div>
          ))}
          
          {/* Total Section */}
          <div className="mt-8 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-gray-500">
                    Total for {cartItems.length} items in {Object.keys(groupedItems).length} package{Object.keys(groupedItems).length > 1 ? 's' : ''}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    €{total.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={handleCreateOffer}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                            transition-colors duration-200 font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Create Offer from Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          showTax={showTax}
          showMarkup={showMarkup}
          pricingRules={pricingRules}
          shippingFees={shippingFees}
        />
      )}
    </div>
  );
}

function CartItem({ item, showTax, showMarkup, pricingRules, shippingFees, onRemove, onUpdateQuantity, onSelect }) {
  const [calculation, setCalculation] = useState(null);
  let imageUrl = '';

  try {
    const images = JSON.parse(item.external_image_urls || '[]');
    imageUrl = images[0] || '';
  } catch (error) {
    console.error('Error parsing image URLs:', error);
  }

  // Calculate price with tax
  const calculatePriceWithTax = (price) => {
    if (!price) return 0;
    const taxRate = 0.22; // 22% tax rate
    return showTax ? parseFloat(price) * (1 + taxRate) : parseFloat(price);
  };

  useEffect(() => {
    if (showMarkup) {
      calculateFinalPrice(item, pricingRules, shippingFees)
        .then(setCalculation)
        .catch(console.error);
    }
  }, [item, showMarkup, pricingRules, shippingFees]);

  const getDisplayPrice = () => {
    if (showMarkup && calculation) {
      const basePrice = calculation.finalPrice;
      return calculatePriceWithTax(basePrice);
    } else {
      return calculatePriceWithTax(item.regular_price);
    }
  };

  return (
    <div className="flex gap-6 p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Product Image - Clickable */}
      <div 
        className="w-32 h-32 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden cursor-pointer"
        onClick={() => onSelect(item)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          {/* Product Name and Info - Clickable */}
          <div 
            className="cursor-pointer"
            onClick={() => onSelect(item)}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-1">{item.name}</h3>
            <div className="text-sm text-gray-500 mb-2">ID: {item.product_id}</div>
            <div className="text-sm text-gray-500 mb-4">Warehouse: {item.warehouse}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Price and Quantity */}
        <div className="flex items-end justify-between mt-4">
          <div>
            {showMarkup && calculation ? (
              <div className="space-y-1">
                <div className="text-lg font-semibold">
                  €{(getDisplayPrice() * item.quantity).toFixed(2)}
                  {showTax && <span className="text-sm text-gray-500 ml-1">(incl. VAT)</span>}
                </div>
                <div className="text-sm text-gray-500">
                  <div>Base: €{calculatePriceWithTax(calculation.originalPrice).toFixed(2)}</div>
                  <div>Markup: €{calculatePriceWithTax(calculation.markupPrice - calculation.originalPrice).toFixed(2)}</div>
                  <div>Shipping: €{calculatePriceWithTax(calculation.shippingFee).toFixed(2)}</div>
                </div>
              </div>
            ) : (
              <div className="text-lg font-semibold">
                €{(getDisplayPrice() * item.quantity).toFixed(2)}
                {showTax && <span className="text-sm text-gray-500 ml-1">(incl. VAT)</span>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Quantity:</span>
              <div className="flex flex-col">
                <input
                  type="number"
                  min="1"
                  max={Number(item.stock)}
                  value={item.quantity}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newQuantity = Math.min(
                      Math.max(1, parseInt(e.target.value) || 0),
                      Number(item.stock)
                    );
                    onUpdateQuantity(item.id, newQuantity);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-20 px-3 py-1 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-xs text-gray-500 mt-1">
                  {Number(item.stock)} available
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
} 