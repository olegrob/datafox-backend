'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function WarrantyPage() {
  const { data: session } = useSession();
  const [warranties, setWarranties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editWarranty, setEditWarranty] = useState(null);
  const [showOnlyUnmapped, setShowOnlyUnmapped] = useState(false);
  const [exportOnlyUnmapped, setExportOnlyUnmapped] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ isSyncing: false, message: '' });

  useEffect(() => {
    fetchWarranties();
    fetchWarehouses();
  }, [selectedWarehouse]);

  const fetchWarranties = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/warranties${selectedWarehouse !== 'all' ? `?warehouse=${selectedWarehouse}` : ''}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setWarranties(data.warranties || []);
    } catch (error) {
      console.error('Error fetching warranties:', error);
      setWarranties([]);
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

  const runMigration = async () => {
    try {
      const response = await fetch('/api/warranties/migrate', { method: 'POST' });
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
    if (!confirm('This will sync all product warranties. Continue?')) {
      return;
    }

    setSyncStatus({ isSyncing: true, message: 'Starting sync...' });
    try {
      setSyncStatus({ isSyncing: true, message: 'Creating warranties table...' });
      const migrationSuccess = await runMigration();
      if (!migrationSuccess) {
        throw new Error('Failed to create warranties table');
      }

      setSyncStatus({ isSyncing: true, message: 'Syncing warranties...' });
      const response = await fetch('/api/warranties/sync', { method: 'POST' });
      if (!response.ok) throw new Error('Sync failed');
      
      const data = await response.json();
      await fetchWarranties();
      setSyncStatus({ isSyncing: false, message: data.message || 'Sync completed successfully' });
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus({ isSyncing: false, message: 'Sync failed: ' + error.message });
    }
  };

  const handleExport = () => {
    const warrantiesForExport = warranties
      .filter(w => selectedWarehouse === 'all' || w.warehouse === selectedWarehouse)
      .filter(w => !exportOnlyUnmapped || (!w.eraisik_garantii && !w.juriidiline_garantii))
      .reduce((acc, w) => {
        acc[`${w.warehouse}:${w.original_warranty}`] = {
          eraisik_garantii: w.eraisik_garantii || '',
          juriidiline_garantii: w.juriidiline_garantii || ''
        };
        return acc;
      }, {});

    const blob = new Blob([JSON.stringify(warrantiesForExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warranty-mappings${selectedWarehouse === 'all' ? '' : '-' + selectedWarehouse}${exportOnlyUnmapped ? '-unmapped' : ''}.json`;
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
      const importedWarranties = JSON.parse(text);

      for (const [key, mapping] of Object.entries(importedWarranties)) {
        const [warehouse, originalWarranty] = key.split(':');
        await fetch('/api/warranties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            warehouse,
            original_warranty: originalWarranty,
            eraisik_garantii: mapping.eraisik_garantii,
            juriidiline_garantii: mapping.juriidiline_garantii
          })
        });
      }

      await fetchWarranties();
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed: ' + error.message);
    }
  };

  const filteredWarranties = warranties.filter(warranty => {
    const matchesSearch = warranty.original_warranty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warranty.warehouse.toLowerCase().includes(searchTerm.toLowerCase());
    const isUnmapped = !warranty.eraisik_garantii && !warranty.juriidiline_garantii;
    return matchesSearch && (!showOnlyUnmapped || isUnmapped);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Warranty Management</h1>
        
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
            {syncStatus.isSyncing ? 'Syncing...' : 'Sync Warranties'}
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search warranties..."
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

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : warranties.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No warranties found. Click sync to import warranties from products.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Warranty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Private Warranty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Warranty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWarranties.map((warranty) => (
                <tr key={`${warranty.warehouse}-${warranty.original_warranty}`}>
                  <td className="px-6 py-4 whitespace-nowrap">{warranty.original_warranty}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{warranty.warehouse}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editWarranty?.id === warranty.id ? (
                      <input
                        type="text"
                        value={editWarranty.eraisik_garantii || ''}
                        onChange={(e) => setEditWarranty({...editWarranty, eraisik_garantii: e.target.value})}
                        className="border rounded p-1"
                      />
                    ) : (
                      warranty.eraisik_garantii || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editWarranty?.id === warranty.id ? (
                      <input
                        type="text"
                        value={editWarranty.juriidiline_garantii || ''}
                        onChange={(e) => setEditWarranty({...editWarranty, juriidiline_garantii: e.target.value})}
                        className="border rounded p-1"
                      />
                    ) : (
                      warranty.juriidiline_garantii || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editWarranty?.id === warranty.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveWarranty(editWarranty)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditWarranty(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditWarranty(warranty)}
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