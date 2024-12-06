'use client';

import { useState, useEffect } from 'react';

export default function AttributeStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attributes/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
        Error loading statistics: {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Warehouse Distribution */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Warehouse Distribution</h3>
        <div className="space-y-2">
          {stats.warehouses.map(({ warehouse, count }) => (
            <div key={warehouse} className="flex justify-between text-sm">
              <span>{warehouse}</span>
              <span>
                {count} ({((count / stats.total) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Translation Progress */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Translation Progress</h3>
        <div className="space-y-2">
          {['estonian', 'english', 'russian'].map(lang => (
            <div key={lang} className="flex justify-between text-sm">
              <span className="capitalize">{lang}</span>
              <span>
                {((stats.translations[lang] / stats.translations.total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Overall Statistics</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Attributes</span>
            <span>{stats.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Translated</span>
            <span>{stats.translatedCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Active Attributes</span>
            <span>{stats.activeCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Attribute Types</span>
            <span>{stats.types.length}</span>
          </div>
        </div>
      </div>

      {/* Attribute Types */}
      <div className="bg-white p-4 rounded-lg shadow md:col-span-3">
        <h3 className="text-lg font-semibold mb-3">Attribute Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.types.map(({ attribute_type, count }) => (
            <div key={attribute_type} className="flex justify-between text-sm">
              <span>{attribute_type}</span>
              <span>
                {count.toLocaleString()} ({((count / stats.total) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}