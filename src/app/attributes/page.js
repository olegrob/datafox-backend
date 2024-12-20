'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import AttributesList from './components/AttributesList';
import AttributeModal from './components/AttributeModal';
import AttributeStats from './components/AttributeStats';
import AttributesExportImport from './components/AttributesExportImport';
import Pagination from '../components/Pagination';

export default function AttributesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AttributesContent />
    </Suspense>
  );
}

function AttributesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1');
  
  const [attributes, setAttributes] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 300,
    totalPages: 0
  });
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ 
    isSyncing: false, 
    steps: [],
    currentStep: '',
    progress: {
      processed: 0,
      total: 0,
      percentage: 0
    }
  });
  const [isMigrating, setIsMigrating] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);

  useEffect(() => {
    if (status !== 'loading') {
      fetchAttributes(currentPage);
    }
  }, [status, currentPage]);

  const fetchAttributes = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/attributes?page=${page}&limit=300`);
      
      if (response.status === 409) {
        setNeedsMigration(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch attributes');
      }

      const data = await response.json();
      if (!data.attributes) {
        throw new Error('Invalid response format');
      }

      setAttributes(data.attributes);
      setPagination(data.pagination);
      setNeedsMigration(false);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedAttribute(null);
    setShowModal(true);
  };

  const handleEdit = (attribute) => {
    setSelectedAttribute(attribute);
    setShowModal(true);
  };

  const handleSync = async () => {
    try {
      setSyncStatus({ 
        isSyncing: true, 
        steps: ['Starting sync...'],
        currentStep: 'Starting sync...',
        progress: { processed: 0, total: 0, percentage: 0 }
      });

      const response = await fetch('/api/attributes/sync', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Failed to sync attributes');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const update = JSON.parse(line);
            if (update.type === 'progress') {
              setSyncStatus(prev => ({
                ...prev,
                currentStep: update.step,
                steps: [...prev.steps, update.step],
                progress: {
                  processed: update.processed,
                  total: update.total,
                  percentage: Math.round((update.processed / update.total) * 100)
                }
              }));
            }
          } catch (e) {
            // Not a JSON line, ignore
          }
        }
      }

      setSyncStatus(prev => ({ 
        ...prev,
        isSyncing: false,
        currentStep: 'Sync completed successfully',
        steps: [...prev.steps, 'Sync completed successfully']
      }));
      
      fetchAttributes();
    } catch (error) {
      console.error('Error syncing attributes:', error);
      setSyncStatus(prev => ({ 
        ...prev,
        isSyncing: false, 
        currentStep: `Error: ${error.message}`,
        steps: [...prev.steps, `Error: ${error.message}`]
      }));
      setError(error.message);
    }
  };

  const handleMigrate = async () => {
    if (!confirm('This will reset all attributes. Are you sure?')) {
      return;
    }

    try {
      setIsMigrating(true);
      const response = await fetch('/api/attributes/migrate', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Migration failed');
      }
      await handleSync(); // Resync after migration
    } catch (error) {
      console.error('Migration error:', error);
      setError(error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/attributes?${params.toString()}`);
  };

  if (needsMigration && session?.user?.role === 'Admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-4">Database Migration Required</h2>
          <p className="text-yellow-700 mb-4">
            The attributes table needs to be migrated to support warehouse information.
            This will reset all existing attributes. Please make sure to back up any important data before proceeding.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleMigrate}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                isMigrating 
                  ? 'bg-yellow-200 text-yellow-700 cursor-not-allowed'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
              disabled={isMigrating}
            >
              {isMigrating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-yellow-700 border-t-transparent rounded-full" />
                  Migrating...
                </>
              ) : (
                'Migrate Database'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Attributes</h1>
        <div className="flex gap-4">
          {session?.user?.role === 'Admin' && (
            <button
              onClick={handleMigrate}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                isMigrating 
                  ? 'bg-red-200 text-red-500 cursor-not-allowed'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
              disabled={isMigrating || syncStatus.isSyncing}
            >
              {isMigrating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                  Migrating...
                </>
              ) : (
                'Reset & Migrate'
              )}
            </button>
          )}
          <button
            onClick={handleSync}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              syncStatus.isSyncing 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={syncStatus.isSyncing || isMigrating}
          >
            {syncStatus.isSyncing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full" />
                Syncing...
              </>
            ) : (
              'Sync from Products'
            )}
          </button>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            disabled={syncStatus.isSyncing}
          >
            Add New Attribute
          </button>
        </div>
      </div>

      {/* Sync Status Message */}
      {syncStatus.steps.length > 0 && (
        <div className={`mb-4 p-4 rounded-lg ${
          syncStatus.currentStep.includes('Error')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : syncStatus.currentStep.includes('Sync completed successfully')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <h4 className="text-lg font-medium mb-2">Sync Status</h4>
          <ul>
            {syncStatus.steps.map((step, index) => (
              <li key={index} className="text-sm">{step}</li>
            ))}
          </ul>
          {syncStatus.progress.total > 0 && (
            <div className="mt-2">
              <p className="text-sm">Processed: {syncStatus.progress.processed} / {syncStatus.progress.total}</p>
              <p className="text-sm">Progress: {syncStatus.progress.percentage}%</p>
            </div>
          )}
        </div>
      )}

      {needsMigration ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-4">Database Migration Required</h2>
            <p className="text-yellow-700 mb-4">
              The attributes table needs to be migrated to support warehouse information.
              This will reset all existing attributes. Please make sure to back up any important data before proceeding.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleMigrate}
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  isMigrating 
                    ? 'bg-yellow-200 text-yellow-700 cursor-not-allowed'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
                disabled={isMigrating}
              >
                {isMigrating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-yellow-700 border-t-transparent rounded-full" />
                    Migrating...
                  </>
                ) : (
                  'Migrate Database'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <AttributeStats />
          <AttributesExportImport onImportComplete={() => fetchAttributes(currentPage)} />
          <div className="mb-4">
            <AttributesList
              attributes={attributes}
              onEdit={handleEdit}
              onRefresh={() => fetchAttributes(currentPage)}
            />
            {!loading && !error && (
              <div className="mt-4">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <></>
      )}

      {showModal && (
        <AttributeModal
          attribute={selectedAttribute}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchAttributes(currentPage);
          }}
        />
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => fetchAttributes(currentPage)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}