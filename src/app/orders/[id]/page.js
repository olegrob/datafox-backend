'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function OrderDetailPage({ params }) {
  const { data: session } = useSession();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/orders/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view order details</h1>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-gray-600">Order not found</div>
      </div>
    );
  }

  const billing = JSON.parse(order.billing);
  const shipping = JSON.parse(order.shipping);
  const lineItems = JSON.parse(order.line_items);
  const shippingLines = JSON.parse(order.shipping_lines);
  const refunds = JSON.parse(order.refunds);
  const meta = {
    trackingNumber: order.tracking_number ? JSON.parse(order.tracking_number)[0] : null,
    trackingUrl: order.tracking_url ? JSON.parse(order.tracking_url)[0] : null,
    courier: order.courier_name ? JSON.parse(order.courier_name)[0] : null,
    dispatchDate: order.dispatch_date ? JSON.parse(order.dispatch_date)[0] : null
  };

  // Function to format the status with appropriate color
  const getStatusStyle = (status) => {
    const styles = {
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'refunded': 'bg-red-100 text-red-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/orders" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Back to Orders
          </Link>
          <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
        </div>
        <div className="text-sm text-gray-500">
          {new Date(order.date_created).toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Order Details</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span>{order.payment_method_title}</span>
            </div>
            {/* Add shipping method */}
            {shippingLines && shippingLines.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Method</span>
                <span>{shippingLines[0].method_title}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold">{order.currency} {order.total}</span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Billing Address</h3>
              <div className="text-sm text-gray-600">
                <p>{billing.first_name} {billing.last_name}</p>
                <p>{billing.address_1}</p>
                {billing.address_2 && <p>{billing.address_2}</p>}
                <p>{billing.city}, {billing.state} {billing.postcode}</p>
                <p>{billing.country}</p>
                <p>Email: {billing.email}</p>
                <p>Phone: {billing.phone}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
              <div className="text-sm text-gray-600">
                <p>{shipping.first_name} {shipping.last_name}</p>
                <p>{shipping.address_1}</p>
                {shipping.address_2 && <p>{shipping.address_2}</p>}
                <p>{shipping.city}, {shipping.state} {shipping.postcode}</p>
                <p>{shipping.country}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Shipping Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
          <div className="space-y-2">
            {shippingLines && shippingLines.map((shipping, index) => (
              <div key={index} className="border-b pb-2 last:border-0">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span>{shipping.method_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost</span>
                  <span>{order.currency} {shipping.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-6 border-b">Order Items</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {lineItems.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{order.currency} {item.price}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {order.currency} {(item.quantity * parseFloat(item.price)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan="3" className="px-6 py-4 text-sm text-gray-500 text-right">Subtotal:</td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {order.currency} {lineItems.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price)), 0).toFixed(2)}
              </td>
            </tr>
            {shippingLines && shippingLines.map((shipping, index) => (
              <tr key={index}>
                <td colSpan="3" className="px-6 py-4 text-sm text-gray-500 text-right">
                  Shipping ({shipping.method_title}):
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {order.currency} {parseFloat(shipping.total).toFixed(2)}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">Total:</td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {order.currency} {order.total}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Refunds Section */}
      {refunds && refunds.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-lg font-semibold p-6 border-b">Refunds</h2>
          <div className="p-6">
            {refunds.map((refund, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">
                    Refund #{refund.id} - {new Date(refund.date_created).toLocaleString()}
                  </span>
                  <span className="font-medium text-red-600">
                    {order.currency} {Math.abs(parseFloat(refund.total)).toFixed(2)}
                  </span>
                </div>
                {refund.reason && (
                  <div className="text-sm text-gray-500">
                    Reason: {refund.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping & Tracking */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Shipping & Tracking</h2>
        {meta.trackingNumber ? (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Courier</span>
              <span>{meta.courier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tracking Number</span>
              <a 
                href={meta.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {meta.trackingNumber}
              </a>
            </div>
            {meta.dispatchDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Dispatch Date</span>
                <span>{new Date(meta.dispatchDate).toLocaleString()}</span>
              </div>
            )}
            <div className="mt-4">
              <a 
                href={meta.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Track Package
                <svg className="ml-2 -mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No tracking information available</div>
        )}
      </div>
    </div>
  );
} 