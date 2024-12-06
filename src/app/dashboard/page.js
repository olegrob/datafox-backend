'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('90');

  const periods = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '180', label: 'Last 180 days' },
    { value: '365', label: 'Last year' }
  ];

  useEffect(() => {
    handleSync();
  }, []);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/woocommerce/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ period: selectedPeriod })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to sync data');
      }
      
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to sync data');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert(`Failed to sync: ${error.message}`);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-[#1e1f2e] text-gray-100 py-6">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1f2e] text-gray-100 py-6">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            {stats?.lastUpdated && (
              <div className="text-sm text-gray-400">
                Last updated: {new Date(stats.lastUpdated).toLocaleString()}
              </div>
            )}
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-[#2a2b3d] text-gray-200 px-4 py-2 rounded-lg text-sm"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                       transition-all duration-200 ${
                         isSyncing 
                           ? 'bg-blue-600/50 cursor-not-allowed' 
                           : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                       }`}
            >
              {isSyncing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Data
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#2a2b3d] p-5 rounded-lg relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              </svg>
            </div>
            <div className="text-xs text-gray-400">ORDERS</div>
            <div className="text-2xl font-bold mt-1">{stats.orders}</div>
            <div className={`text-xs ${stats.ordersChange >= 0 ? 'text-green-400' : 'text-red-400'} mt-1`}>
              {stats.ordersChange >= 0 ? '+' : ''}{stats.ordersChange}% From previous period
            </div>
          </div>
          
          <div className="bg-[#2a2b3d] p-5 rounded-lg relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zM12 4c-4.418 0-8 2.239-8 5v10c0 2.761 3.582 5 8 5s8-2.239 8-5V9c0-2.761-3.582-5-8-5z"/>
              </svg>
            </div>
            <div className="text-xs text-gray-400">REVENUE</div>
            <div className="text-2xl font-bold mt-1">€{stats.revenue}</div>
            <div className={`text-xs ${stats.revenueChange >= 0 ? 'text-green-400' : 'text-red-400'} mt-1`}>
              {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}% From previous period
            </div>
          </div>
          
          <div className="bg-[#2a2b3d] p-5 rounded-lg relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <div className="text-xs text-gray-400">AVERAGE ORDER VALUE</div>
            <div className="text-2xl font-bold mt-1">€{stats.averageOrderValue}</div>
            <div className={`text-xs ${stats.averageOrderValueChange >= 0 ? 'text-green-400' : 'text-red-400'} mt-1`}>
              {stats.averageOrderValueChange >= 0 ? '+' : ''}{stats.averageOrderValueChange}% From previous period
            </div>
          </div>
          
          <div className="bg-[#2a2b3d] p-5 rounded-lg relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
            </div>
            <div className="text-xs text-gray-400">PRODUCTS SOLD</div>
            <div className="text-2xl font-bold mt-1">{stats.productsSold}</div>
            <div className={`text-xs ${stats.productsSoldChange >= 0 ? 'text-green-400' : 'text-red-400'} mt-1`}>
              {stats.productsSoldChange >= 0 ? '+' : ''}{stats.productsSoldChange}% From previous period
            </div>
          </div>
        </div>

        {/* Recent Orders and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Orders */}
          <div className="bg-[#2a2b3d] rounded-lg overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-semibold">Recent Buyers</h2>
                <button className="text-gray-400 hover:text-white">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
              </div>
              <div className="text-xs text-gray-400 mb-3">
                Recent purchase history
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-xs text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">Product</th>
                    <th className="px-6 py-3 text-left">Customers</th>
                    <th className="px-6 py-3 text-left">Categories</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {stats.recentOrders.map((order, index) => (
                    <tr key={index} className="text-sm">
                      <td className="px-6 py-4">{order.product}</td>
                      <td className="px-6 py-4">{order.customer}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-[#1e1f2e] text-emerald-400">
                          {order.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">€{order.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Account Transactions */}
          <div className="bg-[#2a2b3d] rounded-lg overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-semibold">Account Transactions</h2>
                <button className="text-gray-400 hover:text-white">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
              </div>
              <div className="text-xs text-gray-400 mb-3">
                Recent transaction history
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody className="divide-y divide-gray-700">
                  {stats.recentTransactions?.map((transaction, index) => (
                    <tr key={index} className="text-sm">
                      <td className="px-6 py-4">
                        <div className="font-medium">{transaction.id}</div>
                        <div className="text-gray-400">{transaction.date}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">€{transaction.amount}</div>
                        <div className="text-gray-400">Amount</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{transaction.cardType}</div>
                        <div className="text-gray-400">Payment</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{transaction.customer}</div>
                        <div className="text-gray-400">Customer</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 