'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function TresoorConnection() {
  const { data: session } = useSession();
  const [warehouseId, setWarehouseId] = useState(null);
  const [warehouseDetails, setWarehouseDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);

  const fetchWarehouseId = async (email) => {
    try {
      console.log('Fetching warehouse ID for:', email);
      const response = await fetch('/api/tresoor/warehouse-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const responseData = await response.json();
      console.log('Warehouse ID Response:', responseData);
      setRawResponse(responseData);

      if (!response.ok) {
        throw new Error(`Failed to fetch warehouse ID: ${responseData.error || 'Unknown error'}`);
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseData.data, 'text/xml');
      
      const idValue = xmlDoc.querySelector('BrowseLAODResult clsLadu ID Value')?.textContent;
      console.log('Extracted ID:', idValue);
      
      if (!idValue) {
        throw new Error('No warehouse ID found in response');
      }

      return idValue;
    } catch (err) {
      console.error('Detailed error in fetchWarehouseId:', err);
      throw err;
    }
  };

  const fetchWarehouseDetails = async (warehouseId) => {
    try {
      const response = await fetch('/api/tresoor/warehouse-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ warehouseId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch warehouse details: ${errorData.error || 'Unknown error'}`);
      }

      const { data } = await response.json();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'text/xml');
      
      const items = xmlDoc.querySelectorAll('BrowseLaojaakResult clsJaak');
      const parsedItems = Array.from(items).map(item => ({
        id: item.querySelector('OBJEKTI_ID Value')?.textContent,
        name: item.querySelector('NIMETUS')?.textContent,
        code: item.querySelector('SISEKOOD')?.textContent,
        barcode: item.querySelector('RIBAKOOD')?.textContent,
        quantity: item.querySelector('KOGUS Value')?.textContent,
        unit: item.querySelector('YHIK')?.textContent,
        price: item.querySelector('VIIMANE_OSTUHIND Value')?.textContent
      }));

      return {
        totalItems: items.length,
        items: parsedItems
      };
    } catch (err) {
      console.error('Error fetching warehouse details:', err);
      throw err;
    }
  };

  useEffect(() => {
    const initializeConnection = async () => {
      if (session?.user?.email) {
        setLoading(true);
        setError(null);
        try {
          // First get the warehouse ID
          const id = await fetchWarehouseId(session.user.email);
          setWarehouseId(id);

          // Then get the warehouse details
          if (id) {
            const details = await fetchWarehouseDetails(id);
            setWarehouseDetails(details);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    initializeConnection();
  }, [session]);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">Connection Error</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        {rawResponse && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-red-800">Error Details:</h4>
            <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
              {JSON.stringify(rawResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Tresoor Connection</h2>
      
      {loading && (
        <div className="text-gray-500">
          Connecting to Tresoor...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Connection Error</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          {rawResponse && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-red-800">Error Details:</h4>
              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {warehouseId && warehouseDetails ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Warehouse ID:</span>
            <span className="font-medium">{warehouseId}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-4">Warehouse Details</h3>
            <div className="text-sm">
              <p className="mb-4">Total Items: {warehouseDetails.totalItems}</p>
              {warehouseDetails.items && warehouseDetails.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Barcode
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {warehouseDetails.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-normal">
                            <div className="text-sm text-gray-900">{item.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.barcode}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-900">
                              {item.quantity} {item.unit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-900">
                              €{parseFloat(item.price).toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 mt-2">No items found in warehouse</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-500">No warehouse connection established</p>
          {rawResponse && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Raw Response</h3>
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 