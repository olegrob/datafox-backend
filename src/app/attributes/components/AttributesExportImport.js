'use client';

import { useState, useEffect } from 'react';

export default function AttributesExportImport({ onImportComplete }) {
  const [exportWarehouse, setExportWarehouse] = useState('all');
  const [exportOnlyUnmapped, setExportOnlyUnmapped] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/attributes/warehouses');
      if (!response.ok) {
        throw new Error('Failed to fetch warehouses');
      }
      const data = await response.json();
      setWarehouses(data.warehouses || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handleExport = async () => {
    try {
      setExportProgress({ current: 0, total: 0 });
      let offset = 0;
      const limit = 1000;
      const allAttributes = [];

      while (true) {
        const params = new URLSearchParams({
          warehouse: exportWarehouse === 'all' ? '' : exportWarehouse,
          onlyUnmapped: exportOnlyUnmapped,
          offset: offset,
          limit: limit
        });

        const response = await fetch(`/api/attributes/export?${params}`);
        if (!response.ok) {
          throw new Error('Failed to export attributes');
        }

        const data = await response.json();
        if (!data.attributes.length) {
          break;
        }

        allAttributes.push(...data.attributes);
        offset += limit;
        setExportProgress({ current: allAttributes.length, total: allAttributes.length + limit });
      }

      // Create and download the file
      const blob = new Blob([JSON.stringify(allAttributes, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `attributes-export${exportWarehouse !== 'all' ? `-${exportWarehouse}` : ''}${exportOnlyUnmapped ? '-unmapped' : ''}.json`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportProgress(null);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export attributes: ' + error.message);
      setExportProgress(null);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const attributes = JSON.parse(text);

      const response = await fetch('/api/attributes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes })
      });

      if (!response.ok) {
        throw new Error('Failed to import attributes');
      }

      const result = await response.json();
      alert(`Import completed:\n` +
        `- ${result.stats.updated} attributes updated\n` +
        `- ${result.stats.unchanged} attributes unchanged\n` +
        `- ${result.stats.failed} failed\n` +
        (result.stats.errors.length > 0 ? 
          `\nErrors:\n${result.stats.errors.map(e => `- ${e.attribute}: ${e.error}`).join('\n')}` : 
          '')
      );
      
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import attributes: ' + error.message);
    } finally {
      setImporting(false);
      event.target.value = null; // Reset file input
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to delete all attributes? This action cannot be undone.')) {
      return;
    }

    try {
      setIsResetting(true);
      const response = await fetch('/api/attributes/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset attributes');
      }

      alert('All attributes have been deleted. You can now sync fresh data.');
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Error resetting attributes:', error);
      alert('Failed to reset attributes: ' + error.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Export/Import Attributes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Section */}
        <div className="border rounded p-4">
          <h3 className="font-medium mb-3">Export Attributes</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Warehouse</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={exportWarehouse}
                onChange={(e) => setExportWarehouse(e.target.value)}
              >
                <option value="all">All Warehouses</option>
                {warehouses.map(wh => (
                  <option key={wh.warehouse} value={wh.warehouse}>
                    {wh.warehouse} ({wh.count} attributes)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="unmappedOnly"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={exportOnlyUnmapped}
                onChange={(e) => setExportOnlyUnmapped(e.target.checked)}
              />
              <label htmlFor="unmappedOnly" className="ml-2 block text-sm text-gray-900">
                Only unmapped Estonian translations
              </label>
            </div>

            <button
              onClick={handleExport}
              disabled={exportProgress !== null}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {exportProgress ? `Exporting (${exportProgress.current} attributes)...` : 'Export'}
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="border rounded p-4">
          <h3 className="font-medium mb-3">Import Attributes</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select JSON file</label>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {importing && (
              <div className="text-sm text-gray-500">
                Importing attributes...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          disabled={isResetting}
        >
          {isResetting ? (
            <>
              <span className="animate-spin inline-block mr-2">⟳</span>
              Resetting...
            </>
          ) : (
            'Reset Attributes'
          )}
        </button>
      </div>
    </div>
  );
}
