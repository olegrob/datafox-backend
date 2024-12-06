'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ManufacturerPage() {
  const { data: session } = useSession();
  const [manufacturers, setManufacturers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editManufacturer, setEditManufacturer] = useState(null);
  const [showOnlyUnmapped, setShowOnlyUnmapped] = useState(false);
  const [exportOnlyUnmapped, setExportOnlyUnmapped] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ isSyncing: false, message: '' });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchManufacturers();
    fetchWarehouses();
    fetchStats();
  }, [selectedWarehouse]);

  useEffect(() => {
    if (syncStatus.message?.includes('completed successfully')) {
      fetchStats();
    }
  }, [syncStatus.message]);

  const fetchManufacturers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/manufacturers${selectedWarehouse !== 'all' ? `?warehouse=${selectedWarehouse}` : ''}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setManufacturers(data.manufacturers || []);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      setManufacturers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses');
      const data = await response.json();
      setWarehouses(data.warehouses);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/manufacturers/stats');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const runMigration = async () => {
    try {
      const response = await fetch('/api/manufacturers/migrate', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Migration failed');
      }
      const data = await response.json();
      console.log('Migration result:', data);
      return true;
    } catch (error) {
      console.error('Migration error:', error);
      return false;
    }
  };

  const handleSync = async () => {
    if (!confirm('This will sync all product manufacturers. Continue?')) {
      return;
    }

    setSyncStatus({ isSyncing: true, message: 'Starting sync...' });
    try {
      setSyncStatus({ isSyncing: true, message: 'Creating manufacturers table...' });
      const migrationSuccess = await runMigration();
      if (!migrationSuccess) {
        throw new Error('Failed to create manufacturers table');
      }

      setSyncStatus({ isSyncing: true, message: 'Syncing manufacturers...' });
      const response = await fetch('/api/manufacturers/sync', { method: 'POST' });
      if (!response.ok) throw new Error('Sync failed');
      
      const data = await response.json();
      await fetchManufacturers();
      setSyncStatus({ isSyncing: false, message: data.message || 'Sync completed successfully' });
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus({ isSyncing: false, message: 'Sync failed: ' + error.message });
    }
  };

  const handleSaveManufacturer = async (manufacturer) => {
    try {
      const response = await fetch('/api/manufacturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_manufacturer: manufacturer.original_manufacturer,
          warehouse: manufacturer.warehouse,
          mapped_manufacturer: manufacturer.mapped_manufacturer
        })
      });

      if (!response.ok) throw new Error('Failed to save manufacturer');
      
      setEditManufacturer(null);
      await fetchManufacturers();
    } catch (error) {
      console.error('Error saving manufacturer:', error);
      alert('Failed to save manufacturer: ' + error.message);
    }
  };

  const handleExport = () => {
    const manufacturersForExport = manufacturers
      .filter(m => selectedWarehouse === 'all' || m.warehouse === selectedWarehouse)
      .filter(m => !exportOnlyUnmapped || !m.mapped_manufacturer)
      .reduce((acc, m) => {
        acc[`${m.warehouse}:${m.original_manufacturer}`] = {
          mapped_manufacturer: m.mapped_manufacturer || ''
        };
        return acc;
      }, {});

    const blob = new Blob([JSON.stringify(manufacturersForExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manufacturer-mappings${selectedWarehouse === 'all' ? '' : '-' + selectedWarehouse}${exportOnlyUnmapped ? '-unmapped' : ''}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedManufacturers = JSON.parse(text);

      for (const [key, mapping] of Object.entries(importedManufacturers)) {
        const [warehouse, originalManufacturer] = key.split(':');
        await fetch('/api/manufacturers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            warehouse,
            original_manufacturer: originalManufacturer,
            mapped_manufacturer: mapping.mapped_manufacturer
          })
        });
      }

      await fetchManufacturers();
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed: ' + error.message);
    }
  };

  const filteredManufacturers = manufacturers.filter(manufacturer => {
    const matchesSearch = manufacturer.original_manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manufacturer.warehouse.toLowerCase().includes(searchTerm.toLowerCase());
    const isUnmapped = !manufacturer.mapped_manufacturer;
    return matchesSearch && (!showOnlyUnmapped || isUnmapped);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Manufacturer Management</h1>
        
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="exportUnmapped"
              checked={exportOnlyUnmapped}
              onChange={(e) => setExportOnlyUnmapped(e.target.checked)}
              className="form-checkbox"
            />
            <label htmlFor="exportUnmapped">Export only unmapped</label>
          </div>

          <button
            onClick={handleExport}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Export
          </button>

          <label className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer">
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <button
            onClick={handleSync}
            disabled={syncStatus.isSyncing}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              syncStatus.isSyncing 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            {syncStatus.isSyncing ? 'Syncing...' : 'Sync Manufacturers'}
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search manufacturers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow p-2 border rounded"
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showUnmapped"
            checked={showOnlyUnmapped}
            onChange={(e) => setShowOnlyUnmapped(e.target.checked)}
            className="form-checkbox"
          />
          <label htmlFor="showUnmapped">Show only unmapped</label>
        </div>
      </div>

      {syncStatus.message && (
        <div className={`mb-4 p-4 rounded ${
          syncStatus.message.includes('failed') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {syncStatus.message}
        </div>
      )}

      {stats && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Overall Progress</h3>
            <div className="mt-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Mapping Progress</span>
                <span>{stats.mappingProgress}%</span>
              </div>
              <div className="mt-1 relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${stats.mappingProgress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Manufacturers</h3>
            <dl className="mt-2 grid grid-cols-1 gap-1">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Total Unique</dt>
                <dd className="text-sm font-medium text-gray-900">{stats.uniqueManufacturers}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Mapped</dt>
                <dd className="text-sm font-medium text-gray-900">{stats.mappedManufacturers}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Unmapped</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {stats.uniqueManufacturers - stats.mappedManufacturers}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Warehouses</h3>
            <dl className="mt-2 grid grid-cols-1 gap-1">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Total</dt>
                <dd className="text-sm font-medium text-gray-900">{stats.totalWarehouses}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">With Mappings</dt>
                <dd className="text-sm font-medium text-gray-900">{stats.mappedWarehouses}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Total Products</dt>
                <dd className="text-sm font-medium text-gray-900">{stats.totalProducts}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Mappings</h3>
            <dl className="mt-2 grid grid-cols-1 gap-1">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Total</dt>
                <dd className="text-sm font-medium text-gray-900">{stats.totalMappings}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Completed</dt>
                <dd className="text-sm font-medium text-gray-900">{stats.completedMappings}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Remaining</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {stats.totalMappings - stats.completedMappings}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : manufacturers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No manufacturers found. Click sync to import manufacturers from products.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Manufacturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mapped Manufacturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredManufacturers.map((manufacturer) => (
                <tr key={`${manufacturer.warehouse}-${manufacturer.original_manufacturer}`}>
                  <td className="px-6 py-4 whitespace-nowrap">{manufacturer.original_manufacturer}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{manufacturer.warehouse}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editManufacturer?.id === manufacturer.id ? (
                      <input
                        type="text"
                        value={editManufacturer.mapped_manufacturer || ''}
                        onChange={(e) => setEditManufacturer({...editManufacturer, mapped_manufacturer: e.target.value})}
                        className="border rounded p-1"
                      />
                    ) : (
                      manufacturer.mapped_manufacturer || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editManufacturer?.id === manufacturer.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveManufacturer(editManufacturer)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditManufacturer(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditManufacturer(manufacturer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 