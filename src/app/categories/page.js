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
  const [editSearchTerm, setEditSearchTerm] = useState('');
  const [showMappingSearch, setShowMappingSearch] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryPath, setNewCategoryPath] = useState('');
  const [newCategoryParts, setNewCategoryParts] = useState(['']);
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [importInProgress, setImportInProgress] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [exportOnlyUnmapped, setExportOnlyUnmapped] = useState(false);
  const [showOnlyUnmapped, setShowOnlyUnmapped] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

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
        setShowMappingSearch(false);
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
    setEditSearchTerm('');
    setShowMappingSearch(false);
  };

  const handleSaveMapping = (category) => {
    if (editValue.trim()) {
      saveMapping(category.category, category.warehouse, editValue.trim());
    }
    setShowMappingSearch(false);
  };

  const getUniqueMappedCategories = () => {
    const uniqueMappings = new Set();
    Object.values(mappings).forEach(mapping => {
      if (mapping) {
        uniqueMappings.add(mapping);
      }
    });
    return Array.from(uniqueMappings);
  };

  const filteredMappedCategories = getUniqueMappedCategories().filter(
    category => category.toLowerCase().includes(editSearchTerm.toLowerCase())
  );

  const sortedCategories = [...categories].sort((a, b) => {
    const aCount = parseInt(a.productCount) || 0;
    const bCount = parseInt(b.productCount) || 0;
    return sortOrder === 'desc' ? bCount - aCount : aCount - bCount;
  });

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'desc' ? 'asc' : 'desc');
  };

  const filteredCategories = sortedCategories.filter(category => {
    const matchesWarehouse = selectedWarehouse === 'all' || category.warehouse === selectedWarehouse;
    const matchesSearch = searchTerm === '' || 
      category.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.warehouse.toLowerCase().includes(searchTerm.toLowerCase());
    
    const mappingKey = `${category.warehouse}:${category.category}`;
    const isUnmapped = !mappings[mappingKey];
    
    return matchesWarehouse && matchesSearch && (!showOnlyUnmapped || isUnmapped);
  });

  const warehouses = [...new Set(categories.map(category => category.warehouse))].filter(Boolean);

  const handleExport = () => {
    // Filter categories by selected warehouse if not "all"
    const categoriesToExport = categories.filter(category => 
      selectedWarehouse === 'all' || category.warehouse === selectedWarehouse
    );

    console.log('Selected warehouse:', selectedWarehouse);
    console.log('Categories to export:', categoriesToExport);
    console.log('All mappings:', mappings);

    // Create mappings object for all categories
    const exportMappings = {};
    categoriesToExport.forEach(category => {
      const mappingKey = `${category.warehouse}:${category.category}`;
      const mapping = mappings[mappingKey];
      
      // If exporting only unmapped categories, skip the mapped ones
      if (exportOnlyUnmapped && mapping) {
        return;
      }
      
      // If exporting all categories or if the category is unmapped
      exportMappings[category.category] = mapping || null;
    });

    console.log('Export mappings:', exportMappings);

    // Create the export data
    const exportData = JSON.stringify(exportMappings, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create filename with warehouse and mapping type info
    const filename = `category-mappings${selectedWarehouse === 'all' ? '' : '-' + selectedWarehouse}${exportOnlyUnmapped ? '-unmapped' : ''}.json`;

    // Download the file
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportInProgress(true);
    setImportStats(null);

    try {
      const text = await file.text();
      const importedMappings = JSON.parse(text);
      
      const stats = {
        total: Object.keys(importedMappings).length,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: []
      };

      for (const [categoryName, mappedCategory] of Object.entries(importedMappings)) {
        stats.processed++;
        
        try {
          const matchingCategories = categories.filter(cat => cat.category === categoryName);
          
          if (matchingCategories.length === 0) {
            stats.failed++;
            stats.errors.push({
              category: categoryName,
              error: 'Category not found in any warehouse'
            });
            continue;
          }

          if (!mappedCategory) {
            stats.skipped++;
            continue;
          }

          for (const category of matchingCategories) {
            try {
              await saveMapping(category.category, category.warehouse, mappedCategory);
              stats.successful++;
            } catch (error) {
              stats.failed++;
              stats.errors.push({
                category: categoryName,
                warehouse: category.warehouse,
                error: error.message || 'Failed to save mapping'
              });
            }
          }
        } catch (error) {
          stats.failed++;
          stats.errors.push({
            category: categoryName,
            error: error.message || 'Processing error'
          });
        }
      }

      setImportStats(stats);
    } catch (error) {
      setImportStats({
        total: 0,
        processed: 0,
        successful: 0,
        failed: 1,
        skipped: 0,
        errors: [{
          error: 'Failed to parse import file. Please ensure it is valid JSON.'
        }]
      });
    } finally {
      setImportInProgress(false);
    }
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleDeleteMappedCategory = (mappedCategory) => {
    // Find all mappings that use this category and delete them
    Object.entries(mappings).forEach(([key, value]) => {
      if (value === mappedCategory) {
        const [warehouse, originalCategory] = key.split(':');
        deleteMapping(originalCategory, warehouse);
      }
    });
  };

  const buildCategoryTree = () => {
    // Create a tree structure from mapped categories
    const tree = {};
    
    Object.entries(mappings).forEach(([key, mappedCategory]) => {
      if (mappedCategory) {
        const parts = mappedCategory.split('>').map(part => part.trim());
        let currentLevel = tree;
        
        parts.forEach((part, index) => {
          if (!currentLevel[part]) {
            currentLevel[part] = {
              children: {},
              originalCategories: []
            };
          }
          
          if (index === parts.length - 1) {
            const [warehouse, originalCategory] = key.split(':');
            currentLevel[part].originalCategories.push({
              category: originalCategory,
              warehouse: warehouse
            });
          }
          
          currentLevel = currentLevel[part].children;
        });
      }
    });
    
    return tree;
  };

  const renderFolderStructure = (node, path = '') => {
    if (!node || Object.keys(node).length === 0) return null;

    return (
      <div className="ml-4">
        {Object.entries(node).map(([name, data]) => {
          const currentPath = path ? `${path}>${name}` : name;
          const hasChildren = Object.keys(data.children).length > 0;
          const isExpanded = expandedFolders.has(currentPath);

          return (
            <div key={name} className="my-1">
              <div className="flex items-center justify-between group hover:bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => hasChildren && toggleFolder(currentPath)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {hasChildren ? (
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    ) : (
                      <svg 
                        className="w-4 h-4 text-gray-400" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    )}
                    <span className="text-sm font-medium text-gray-900">{name}</span>
                  </button>
                </div>
                <button
                  onClick={() => handleDeleteMappedCategory(currentPath)}
                  className="w-8 h-8 flex items-center justify-center text-xl font-bold text-red-500 hover:bg-red-50 rounded-full"
                  title="Delete mapped category"
                >
                  ×
                </button>
              </div>
              {isExpanded && renderFolderStructure(data.children, currentPath)}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="p-2 text-sm">Loading...</div>;
  if (error) return <div className="p-2 text-sm text-red-600">Error: {error}</div>;

  // Calculate statistics
  const totalCategories = categories.length;
  const mappedCategories = categories.filter(category => {
    const mappingKey = `${category.warehouse}:${category.category}`;
    return mappings[mappingKey];
  }).length;
  const mappingPercentage = totalCategories > 0 
    ? Math.round((mappedCategories / totalCategories) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto p-2">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Categories</div>
          <div className="text-2xl font-semibold text-gray-900">{totalCategories}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Mapped Categories</div>
          <div className="text-2xl font-semibold text-gray-900">{mappedCategories}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Mapping Progress</div>
          <div className="flex items-center">
            <div className="text-2xl font-semibold text-gray-900">{mappingPercentage}%</div>
            <div className="ml-3 flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${mappingPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tree Structure */}
      <div className="mt-6 p-4 border rounded-lg bg-white">
        <h3 className="text-lg font-medium mb-4">Mapped Category Structure</h3>
        <p className="text-sm text-gray-600 mb-4">Visual representation of your mapped categories</p>
        {renderFolderStructure(buildCategoryTree())}
      </div>

      {/* Import Status Modal */}
      {importStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Import Results</h3>
            <div className="space-y-2">
              <p>Successfully imported {importStats.successful} mappings</p>
              {importStats.failed > 0 && (
                <p className="text-red-600">Failed to import {importStats.failed} mappings</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setImportStats(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p className="text-gray-600">
              Are you sure you want to delete this mapped category? This will remove all mappings that use this category.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCategoryToDelete(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteMappedCategory(categoryToDelete);
                  setShowDeleteConfirm(false);
                  setCategoryToDelete(null);
                }}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Create New Category</h3>
            <div className="space-y-3">
              {newCategoryParts.map((part, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {index > 0 && <span className="text-gray-500">&gt;</span>}
                  <input
                    type="text"
                    value={part}
                    onChange={(e) => {
                      const updatedParts = [...newCategoryParts];
                      updatedParts[index] = e.target.value;
                      setNewCategoryParts(updatedParts);
                    }}
                    placeholder={`Category level ${index + 1}`}
                    className="flex-grow px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {newCategoryParts.length > 1 && (
                    <button
                      onClick={() => {
                        const updatedParts = newCategoryParts.filter((_, i) => i !== index);
                        setNewCategoryParts(updatedParts);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => {
                  setNewCategoryParts([...newCategoryParts, '']);
                }}
                className="text-blue-500 hover:text-blue-600 text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add subcategory
              </button>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewCategoryModal(false);
                  setNewCategoryParts(['']);
                }}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const filteredParts = newCategoryParts.filter(part => part.trim() !== '');
                  const newCategory = filteredParts.join(' > ');
                  setEditValue(newCategory);
                  setNewCategoryParts(['']);
                  setShowNewCategoryModal(false);
                }}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <h1 className="text-lg font-medium text-gray-900">Categories</h1>
        <div className="flex flex-wrap items-center gap-4">
          {/* Export Controls */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map(warehouse => (
                <option key={warehouse} value={warehouse}>{warehouse}</option>
              ))}
            </select>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="exportUnmapped"
                checked={exportOnlyUnmapped}
                onChange={(e) => setExportOnlyUnmapped(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <label htmlFor="exportUnmapped" className="text-sm text-gray-700">
                Export only unmapped
              </label>
            </div>
            <button
              onClick={handleExport}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Export
            </button>
          </div>

          {/* Import Button */}
          <div className="relative">
            <input
              type="file"
              onChange={handleImport}
              className="hidden"
              id="import-input"
              accept=".json"
              disabled={importInProgress}
            />
            <label
              htmlFor="import-input"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded border 
                ${importInProgress 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'}`}
            >
              {importInProgress ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Importing...
                </>
              ) : (
                'Import Mappings'
              )}
            </label>
          </div>

          {/* Search Input */}
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2 mr-4">
            <input
              type="checkbox"
              id="showUnmapped"
              checked={showOnlyUnmapped}
              onChange={(e) => setShowOnlyUnmapped(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <label htmlFor="showUnmapped" className="text-sm text-gray-700">
              Show only unmapped
            </label>
          </div>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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
                    <td className="px-3 py-1.5 text-sm text-gray-900">
                      {isEditing ? (
                        <div className="relative flex items-center space-x-2">
                          <div className="relative flex-grow">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => {
                                setEditValue(e.target.value);
                                setEditSearchTerm(e.target.value);
                                setShowMappingSearch(true);
                              }}
                              onFocus={() => setShowMappingSearch(true)}
                              className="w-full px-3 py-1 border rounded"
                              placeholder="Enter or search mapped category..."
                            />
                            {/* Dropdown for existing mappings */}
                            {showMappingSearch && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                {/* Create New Category button */}
                                <div
                                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer border-b flex items-center text-blue-600"
                                  onClick={() => {
                                    setShowNewCategoryModal(true);
                                    setShowMappingSearch(false);
                                  }}
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Create New Category
                                </div>
                                {/* Existing mappings */}
                                {filteredMappedCategories.map((mappedCategory, index) => (
                                  <div
                                    key={index}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      setEditValue(mappedCategory);
                                      setShowMappingSearch(false);
                                    }}
                                  >
                                    {mappedCategory}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleSaveMapping(category)}
                            className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditMapping(null);
                              setEditValue('');
                              setShowMappingSearch(false);
                            }}
                            className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Link 
                            href={`/?category=${encodeURIComponent(category.category)}&warehouse=${encodeURIComponent(category.warehouse)}`}
                            className="hover:text-blue-600"
                          >
                            {category.category}
                          </Link>
                          {mappedCategory && (
                            <div className="mt-1">
                              <div className="text-xs text-gray-400 mb-1">Mapped to:</div>
                              <Link 
                                href={`/?category=${encodeURIComponent(mappedCategory)}&warehouse=${encodeURIComponent(category.warehouse)}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {mappedCategory}
                              </Link>
                            </div>
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
                              setShowMappingSearch(false);
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
