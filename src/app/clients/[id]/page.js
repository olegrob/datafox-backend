'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Toast from '@/app/components/Toast';
import { useRouter } from 'next/navigation';

export default function ClientDetailPage({ params }) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      const currentPath = window.location.pathname;
      router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
    },
  });
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
    let isMounted = true;

    const fetchData = async () => {
      if (status === 'authenticated' && session) {
        try {
          setIsLoading(true);
          setError(null);
          const response = await fetch(`/api/clients/${params.id}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.accessToken}`
            },
            credentials: 'include'
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              const currentPath = window.location.pathname;
              router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
              throw new Error('Please sign in to view client details');
            }
            throw new Error('Failed to fetch client');
          }
          
          const data = await response.json();
          if (isMounted) {
            setClient(data.client);
            setOrders(data.orders);
            setEditedData(data.client);
          }
        } catch (error) {
          console.error('Error:', error);
          if (isMounted) {
            setError(error.message);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [status, session, params.id, router]);

  const handleSave = async () => {
    if (!session) {
      const currentPath = window.location.pathname;
      router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/clients/${params.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify(editedData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          const currentPath = window.location.pathname;
          router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
          throw new Error('Please sign in to update client');
        }
        throw new Error('Failed to update client');
      }
      
      setClient(editedData);
      setIsEditing(false);
      setToastMessage('Client updated successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error:', error);
      setToastMessage(error.message);
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/api/auth/signin');
    return null;
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

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-gray-600">Client not found</div>
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
          <h2 className="text-lg font-semibold mb-4">Client Details</h2>
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
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border-b pb-4 last:border-0 last:pb-0">
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