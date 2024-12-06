'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Toast from '@/app/components/Toast';

export default function ClientDetailPage({ params }) {
  const { data: session } = useSession();
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editedData, setEditedData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/clients/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }
      
      const data = await response.json();
      
      if (!data.client) {
        throw new Error('Client not found');
      }
      
      setClient(data.client);
      setOrders(data.orders || []);
      setEditedData(data.client);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/clients/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData)
      });

      if (!response.ok) throw new Error('Failed to update client');
      
      setClient(editedData);
      setIsEditing(false);
      setToastMessage('Client updated successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error:', error);
      setToastMessage('Failed to update client');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={() => fetchClientData()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/clients" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Back to Clients
          </Link>
          <h1 className="text-2xl font-bold">{client.first_name} {client.last_name}</h1>
        </div>
        <div>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                         disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Client
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Client Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Client Details
            {client?.total_orders > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({client.total_orders} orders, €{parseFloat(client.total_spent || 0).toFixed(2)} total)
              </span>
            )}
          </h2>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={editedData.first_name}
                  onChange={(e) => setEditedData({...editedData, first_name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={editedData.last_name}
                  onChange={(e) => setEditedData({...editedData, last_name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editedData.email}
                  onChange={(e) => setEditedData({...editedData, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={editedData.phone}
                  onChange={(e) => setEditedData({...editedData, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  type="text"
                  value={editedData.company || ''}
                  onChange={(e) => setEditedData({...editedData, company: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span>{client.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone</span>
                <span>{client.phone}</span>
              </div>
              {client.company && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Company</span>
                  <span>{client.company}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders</span>
                <span>{client.total_orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Spent</span>
                <span>€{parseFloat(client.total_spent).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Order History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Order History</h2>
          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border-b pb-4 last:border-0">
                  <Link 
                    href={`/orders/${order.woo_order_id}`}
                    className="flex justify-between items-start hover:bg-gray-50 p-2 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">#{order.order_number}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.date_created).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">€{order.total}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No orders found for this client.
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastMessage.includes('success') ? 'success' : 'error'}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
} 
