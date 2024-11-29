'use client';

import { useState, useEffect } from 'react';

export default function AttributeStats({ attributes }) {
  const [warehouseStats, setWarehouseStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchWarehouseStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/attributes/warehouse-stats');
        if (!response.ok) throw new Error('Failed to fetch warehouse stats');
        const data = await response.json();
        setWarehouseStats(data.stats || {});
      } catch (error) {
        console.error('Error fetching warehouse stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWarehouseStats();
  }, []);

  // Calculate translation stats
  const translationStats = attributes.reduce((acc, attr) => {
    if (attr.ee_translation) acc.estonian++;
    if (attr.en_translation) acc.english++;
    if (attr.ru_translation) acc.russian++;
    return acc;
  }, { estonian: 0, english: 0, russian: 0 });

  // Calculate type stats
  const typeStats = attributes.reduce((acc, attr) => {
    const type = attr.attribute_type || 'text';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Calculate attribute usage stats
  const usageStats = {
    total: attributes.length,
    translated: attributes.filter(attr => 
      attr.ee_translation || attr.en_translation || attr.ru_translation
    ).length,
    active: attributes.filter(attr => attr.is_active).length,
    types: Object.keys(typeStats).length
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Warehouse Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Warehouse Distribution</h3>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(warehouseStats)
              .sort(([, a], [, b]) => b - a) // Sort by count descending
              .map(([warehouse, count]) => (
                <div key={warehouse} className="flex items-center justify-between">
                  <span className="text-gray-600">{warehouse}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-blue-100 rounded-full w-32 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ 
                          width: `${(count / attributes.length) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {count} ({Math.round((count / attributes.length) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Translation Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Translation Progress</h3>
        <div className="space-y-4">
          {Object.entries(translationStats).map(([language, count]) => (
            <div key={language} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="capitalize text-gray-600">{language}</span>
                <span className="text-gray-500">
                  {Math.round((count / attributes.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ 
                    width: `${(count / attributes.length) * 100}%` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attribute Types */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Attribute Types</h3>
        <div className="space-y-3">
          {Object.entries(typeStats)
            .sort(([, a], [, b]) => b - a) // Sort by count descending
            .map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="capitalize text-gray-600">{type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {count} ({Math.round((count / attributes.length) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Overall Stats */}
      <div className="bg-white rounded-lg shadow p-6 md:col-span-3">
        <h3 className="text-lg font-semibold mb-4">Overall Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {usageStats.total}
            </div>
            <div className="text-sm text-gray-500">Total Attributes</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {usageStats.translated}
            </div>
            <div className="text-sm text-gray-500">Translated</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {usageStats.active}
            </div>
            <div className="text-sm text-gray-500">Active Attributes</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {usageStats.types}
            </div>
            <div className="text-sm text-gray-500">Attribute Types</div>
          </div>
        </div>
      </div>
    </div>
  );
} 