'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [mappings, setMappings] = useState({});
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editMapping, setEditMapping] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories and their mappings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [categoriesRes, mappingsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/categories/mapping')
        ]);

        if (!categoriesRes.ok || !mappingsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [categoriesData, mappingsData] = await Promise.all([
          categoriesRes.json(),
          mappingsRes.json()
        ]);

        const mappingsLookup = {};
        if (Array.isArray(mappingsData.mappings)) {
          mappingsData.mappings.forEach(mapping => {
            const key = `${mapping.warehouse}:${mapping.original_category}`;
            mappingsLookup[key] = mapping.mapped_category;
          });
        }

        setCategories(Array.isArray(categoriesData.categories) ? categoriesData.categories : []);
        setMappings(mappingsLookup);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const saveMapping = async (originalCategory, warehouse, mappedCategory) => {
    try {
      const response = await fetch('/api/categories/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_category: originalCategory,
          mapped_category: mappedCategory,
          warehouse: warehouse
        })
      });

      if (response.ok) {
        setMappings(prev => ({
          ...prev,
          [`${warehouse}:${originalCategory}`]: mappedCategory
        }));
        setEditMapping(null);
        setEditValue('');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteMapping = async (originalCategory, warehouse) => {
    try {
      const response = await fetch(
        `/api/categories/mapping?original_category=${encodeURIComponent(originalCategory)}&warehouse=${encodeURIComponent(warehouse)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setMappings(prev => {
          const newMappings = { ...prev };
          delete newMappings[`${warehouse}:${originalCategory}`];
          return newMappings;
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleStartEdit = (category, mappedCategory) => {
    const mappingKey = `${category.warehouse}:${category.category}`;
    setEditMapping(mappingKey);
    setEditValue(mappedCategory || '');
  };

  const handleSaveMapping = (category) => {
    if (editValue.trim()) {
      saveMapping(category.category, category.warehouse, editValue.trim());
    }
  };

  const sortedCategories = [...categories].sort((a, b) => {
    const aCount = parseInt(a.productCount) || 0;
    const bCount = parseInt(b.productCount) || 0;
    return sortOrder === 'desc' ? bCount - aCount : aCount - bCount;
  });

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'desc' ? 'asc' : 'desc');
  };

  const filteredCategories = sortedCategories.filter(category => 
    (selectedWarehouse === 'all' || category.warehouse === selectedWarehouse) &&
    (searchTerm === '' || 
     category.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
     category.warehouse.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const warehouses = [...new Set(categories.map(category => category.warehouse))].filter(Boolean);

  if (loading) return <div className="p-2 text-sm">Loading...</div>;
  if (error) return <div className="p-2 text-sm text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <h1 className="text-lg font-medium text-gray-900">Categories</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 pl-8 pr-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
            />
            <svg
              className="absolute left-2 top-1.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="w-40 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Warehouses</option>
            {warehouses.map(warehouse => (
              <option key={warehouse} value={warehouse}>{warehouse}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded">
        <div className="overflow-x-auto">
          <table className="table-fixed w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-4/12 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="w-2/12 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                <th className="w-3/12 px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  <button 
                    onClick={toggleSortOrder}
                    className="inline-flex items-center gap-1 hover:text-gray-700"
                  >
                    Items
                    <svg 
                      className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </th>
                <th className="w-3/12 px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category, index) => {
                const mappingKey = `${category.warehouse}:${category.category}`;
                const mappedCategory = mappings[mappingKey];
                const isEditing = editMapping === mappingKey;

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-sm text-gray-900 truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveMapping(category);
                            if (e.key === 'Escape') {
                              setEditMapping(null);
                              setEditValue('');
                            }
                          }}
                          placeholder="Enter category..."
                          className="w-full px-2 py-0.5 text-sm border rounded focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/?category=${encodeURIComponent(category.category)}&warehouse=${encodeURIComponent(category.warehouse)}`}
                            className="hover:text-blue-600 hover:underline cursor-pointer"
                          >
                            {category.category}
                          </Link>
                          {mappedCategory && (
                            <>
                              <span className="text-xs text-gray-400">→</span>
                              <Link 
                                href={`/?category=${encodeURIComponent(mappedCategory)}&warehouse=${encodeURIComponent(category.warehouse)}`}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {mappedCategory}
                              </Link>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-sm text-gray-600 truncate">
                      {category.warehouse}
                    </td>
                    <td className="px-3 py-1.5 text-sm text-right">
                      <div className="inline-flex flex-col items-end">
                        <span className="font-medium text-gray-900">
                          {category.productCount}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({category.totalStock} items)
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-sm text-right space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveMapping(category)}
                            className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditMapping(null);
                              setEditValue('');
                            }}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(category, mappedCategory)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          {mappedCategory && (
                            <>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => deleteMapping(category.category, category.warehouse)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
