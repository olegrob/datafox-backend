'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ADDITIONAL_PRICE_TAGS, DEFAULT_MARKUPS } from '@/lib/constants';

export default function PricingPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('markup');
  const [rules, setRules] = useState([]);
  const [shippingFees, setShippingFees] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [newRule, setNewRule] = useState({
    name: '',
    warehouse: '',
    min_price: '',
    max_price: '',
    markup_percentage: '',
    priority: 0
  });
  const [newFee, setNewFee] = useState({
    warehouse: '',
    base_fee: ''
  });
  const [templates, setTemplates] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [processingProducts, setProcessingProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingFee, setEditingFee] = useState(null);
  const [editingRule, setEditingRule] = useState(null);

  useEffect(() => {
    fetchRules();
    fetchShippingFees();
    fetchWarehouses();
    fetchTemplates();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/pricing/api/rules');
      if (!response.ok) throw new Error('Failed to fetch rules');
      const data = await response.json();
      setRules(data.rules);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchShippingFees = async () => {
    try {
      const response = await fetch('/pricing/api/shipping');
      if (!response.ok) throw new Error('Failed to fetch shipping fees');
      const data = await response.json();
      setShippingFees(data.fees);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses');
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      const data = await response.json();
      setWarehouses(data.warehouses);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/pricing/api/shipping-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPreviewProduct = async (warehouse) => {
    try {
      const response = await fetch(`/api/products/random?warehouse=${warehouse}`);
      if (!response.ok) throw new Error('Failed to fetch preview product');
      const data = await response.json();
      setPreviewProduct(data.product);
      calculatePreview(data.product);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const calculatePreview = async (product) => {
    if (!product) return;
    
    try {
      const response = await fetch('/pricing/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          templateId: templates.find(t => t.provider === 'DPD')?.id
        })
      });
      
      if (!response.ok) throw new Error('Failed to calculate preview');
      const data = await response.json();
      setPreviewResult(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/pricing/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });
      
      if (!response.ok) throw new Error('Failed to add rule');
      
      fetchRules();
      setNewRule({
        name: '',
        warehouse: '',
        min_price: '',
        max_price: '',
        markup_percentage: '',
        priority: 0
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/pricing/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFee)
      });
      
      if (!response.ok) throw new Error('Failed to add shipping fee');
      
      fetchShippingFees();
      setNewFee({
        warehouse: '',
        base_fee: ''
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add shipping fee: ' + error.message);
    }
  };

  const handleApplyTemplate = async () => {
    if (!newFee.warehouse) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching preview products for warehouse:', newFee.warehouse);
      
      const response = await fetch(`/api/products/warehouse-preview?warehouse=${newFee.warehouse}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch preview products');
      }

      // Calculate shipping for each product
      const processedProducts = await Promise.all(
        data.products.map(async (product) => {
          const dpd_template = templates.find(t => t.provider === 'DPD');
          const previewResponse = await fetch('/pricing/api/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product,
              templateId: dpd_template?.id
            })
          });
          const result = await previewResponse.json();
          return {
            ...product,
            shipping: result
          };
        })
      );

      setProcessingProducts(processedProducts);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error in handleApplyTemplate:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTemplate = async () => {
    try {
      console.log('Starting template application...');
      console.log('Warehouse:', newFee.warehouse);
      
      // Get all templates first
      const templatesResponse = await fetch('/pricing/api/shipping-templates');
      const templatesData = await templatesResponse.json();
      console.log('Available templates:', templatesData);

      // Find DPD template
      const dpdTemplate = templatesData.templates.find(t => t.provider === 'DPD');
      console.log('Found DPD template:', dpdTemplate);

      if (!dpdTemplate) {
        throw new Error('DPD template not found');
      }

      const response = await fetch('/pricing/api/shipping-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouse: newFee.warehouse,
          templateId: dpdTemplate.id
        })
      });
      
      const data = await response.json();
      console.log('Response from template application:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply template');
      }
      
      await fetchShippingFees();
      setShowConfirmation(false);
      setProcessingProducts([]);
      setNewFee({ ...newFee, warehouse: '' });
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to apply template: ' + error.message);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      const response = await fetch(`/pricing/api/rules?id=${ruleId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete rule');
      
      fetchRules(); // Refresh the rules list
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteFee = async (feeId) => {
    if (!confirm('Are you sure you want to delete this shipping fee?')) {
      return;
    }

    try {
      const response = await fetch(`/pricing/api/shipping?id=${feeId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete shipping fee');
      
      fetchShippingFees(); // Refresh the list
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const applyDefaultMarkups = async () => {
    if (!confirm('This will replace all existing markup rules. Continue?')) {
      return;
    }

    try {
      // First delete all existing rules
      await fetch('/pricing/api/rules/clear', { method: 'POST' });

      // Add each markup rule
      for (const rule of DEFAULT_MARKUPS) {
        await fetch('/pricing/api/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Default ${rule.minPrice}-${rule.maxPrice === Infinity ? '∞' : rule.maxPrice}`,
            min_price: rule.minPrice,
            max_price: rule.maxPrice === Infinity ? null : rule.maxPrice,
            markup_percentage: rule.markup,
            priority: 0
          })
        });
      }

      fetchRules();
    } catch (error) {
      console.error('Error applying default markups:', error);
      alert('Failed to apply default markups');
    }
  };

  const applyDefaultShippingFees = async () => {
    if (!confirm('This will replace all existing shipping fees. Continue?')) {
      return;
    }

    try {
      // First get actual warehouses from database
      const warehousesResponse = await fetch('/api/warehouses');
      const { warehouses } = await warehousesResponse.json();
      console.log('Available warehouses:', warehouses);

      // First delete all existing fees
      await fetch('/pricing/api/shipping/clear', { method: 'POST' });

      // Add each shipping fee only if warehouse exists
      for (const [code, details] of Object.entries(ADDITIONAL_PRICE_TAGS)) {
        const matchingWarehouse = warehouses.find(
          w => w.toLowerCase() === details.code.toLowerCase()
        );

        if (matchingWarehouse) {
          await fetch('/pricing/api/shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              warehouse: matchingWarehouse, // Use actual warehouse name from database
              base_fee: details.fee
            })
          });
          console.log(`Applied fee for warehouse: ${matchingWarehouse}`);
        } else {
          console.warn(`No matching warehouse found for code: ${details.code}`);
        }
      }

      fetchShippingFees();
    } catch (error) {
      console.error('Error applying default shipping fees:', error);
      alert('Failed to apply default shipping fees: ' + error.message);
    }
  };

  const handleSaveFee = async (fee) => {
    try {
      const response = await fetch('/pricing/api/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fee)
      });
      
      if (!response.ok) throw new Error('Failed to update shipping fee');
      
      fetchShippingFees();
      setEditingFee(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update shipping fee');
    }
  };

  const handleSaveRule = async (rule) => {
    try {
      const response = await fetch('/pricing/api/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });
      
      if (!response.ok) throw new Error('Failed to update rule');
      
      fetchRules();
      setEditingRule(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update rule');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Pricing Management</h1>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'markup' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('markup')}
        >
          Markup Rules
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'shipping' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('shipping')}
        >
          Shipping Fees
        </button>
      </div>

      {/* Markup Rules Tab */}
      {activeTab === 'markup' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Markup Rules</h2>
            <button
              onClick={applyDefaultMarkups}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Apply Default Markups
            </button>
          </div>
          
          {/* Add New Rule Form */}
          <form onSubmit={handleAddRule} className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Rule Name"
                value={newRule.name}
                onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                className="p-2 border rounded"
              />
              <select
                value={newRule.warehouse}
                onChange={(e) => setNewRule({...newRule, warehouse: e.target.value})}
                className="p-2 border rounded"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Min Price"
                value={newRule.min_price}
                onChange={(e) => setNewRule({...newRule, min_price: e.target.value})}
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={newRule.max_price}
                onChange={(e) => setNewRule({...newRule, max_price: e.target.value})}
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Markup %"
                value={newRule.markup_percentage}
                onChange={(e) => setNewRule({...newRule, markup_percentage: e.target.value})}
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Priority"
                value={newRule.priority}
                onChange={(e) => setNewRule({...newRule, priority: e.target.value})}
                className="p-2 border rounded"
              />
            </div>
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Rule
            </button>
          </form>

          {/* Rules Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Warehouse</th>
                  <th className="p-2 text-left">Price Range</th>
                  <th className="p-2 text-left">Markup %</th>
                  <th className="p-2 text-left">Priority</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {editingRule?.id === rule.id ? (
                        <input
                          type="text"
                          value={editingRule.name}
                          onChange={(e) => setEditingRule({...editingRule, name: e.target.value})}
                          className="p-2 border rounded w-full"
                        />
                      ) : (
                        rule.name
                      )}
                    </td>
                    <td className="p-2">
                      {editingRule?.id === rule.id ? (
                        <select
                          value={editingRule.warehouse || ''}
                          onChange={(e) => setEditingRule({...editingRule, warehouse: e.target.value})}
                          className="p-2 border rounded w-full"
                        >
                          <option value="">All Warehouses</option>
                          {warehouses.map((w) => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      ) : (
                        rule.warehouse || 'All'
                      )}
                    </td>
                    <td className="p-2">
                      {editingRule?.id === rule.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editingRule.min_price || ''}
                            onChange={(e) => setEditingRule({...editingRule, min_price: e.target.value})}
                            className="p-2 border rounded w-full"
                            placeholder="Min"
                          />
                          <input
                            type="number"
                            value={editingRule.max_price || ''}
                            onChange={(e) => setEditingRule({...editingRule, max_price: e.target.value})}
                            className="p-2 border rounded w-full"
                            placeholder="Max"
                          />
                        </div>
                      ) : (
                        `${rule.min_price || '0'} - ${rule.max_price || '∞'}`
                      )}
                    </td>
                    <td className="p-2">
                      {editingRule?.id === rule.id ? (
                        <input
                          type="number"
                          value={editingRule.markup_percentage}
                          onChange={(e) => setEditingRule({...editingRule, markup_percentage: e.target.value})}
                          className="p-2 border rounded w-full"
                        />
                      ) : (
                        `${rule.markup_percentage}%`
                      )}
                    </td>
                    <td className="p-2">
                      {editingRule?.id === rule.id ? (
                        <input
                          type="number"
                          value={editingRule.priority}
                          onChange={(e) => setEditingRule({...editingRule, priority: e.target.value})}
                          className="p-2 border rounded w-full"
                        />
                      ) : (
                        rule.priority
                      )}
                    </td>
                    <td className="p-2">
                      {editingRule?.id === rule.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveRule(editingRule)}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingRule(null)}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingRule(rule)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shipping Fees Tab */}
      {activeTab === 'shipping' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Shipping Fees</h2>
            <button
              onClick={applyDefaultShippingFees}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Apply Default Shipping Fees
            </button>
          </div>
          
          {/* Template Selection */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Apply DPD Parcel Machine Template</h3>
            
            <div className="mb-4">
              <select
                value={newFee.warehouse}
                onChange={(e) => setNewFee({...newFee, warehouse: e.target.value})}
                className="p-2 border rounded"
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>

              {error && (
                <div className="mt-2 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyTemplate}
                disabled={!newFee.warehouse || isLoading}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Apply Template'}
              </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    DPD Parcel Machine Template Preview for {newFee.warehouse}
                  </h3>
                  
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Here&apos;s how the shipping fees will be calculated for products in this warehouse:
                    </p>

                    <div className="divide-y">
                      {processingProducts.map((product) => (
                        <div key={product.id} className="py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-gray-600">
                                Dimensions: {product.height}x{product.width}x{product.depth} cm
                              </p>
                              <p className="text-sm text-gray-600">
                                Weight: {product.weight} kg
                              </p>
                              <p className="text-sm text-gray-600">
                                Price: €{product.price}
                              </p>
                            </div>
                            {product.shipping.error ? (
                              <div className="text-red-600">
                                {product.shipping.error}
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm">Package Size: {product.shipping.size_code}</p>
                                <p className="text-sm">Shipping Fee: €{product.shipping.shipping_fee}</p>
                                <p className="font-medium">
                                  Total: €{(parseFloat(product.price) + product.shipping.shipping_fee).toFixed(2)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        setShowConfirmation(false);
                        setProcessingProducts([]);
                        setError(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmTemplate}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Confirm and Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add New Fee Form */}
          <form onSubmit={handleAddFee} className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={newFee.warehouse}
                onChange={(e) => setNewFee({...newFee, warehouse: e.target.value})}
                className="p-2 border rounded"
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Fixed Shipping Fee (€)"
                value={newFee.base_fee}
                onChange={(e) => setNewFee({...newFee, base_fee: e.target.value})}
                className="p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Shipping Fee
            </button>
          </form>

          {/* Shipping Fees Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Warehouse</th>
                  <th className="p-2 text-left">Shipping Fee</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shippingFees.map((fee) => (
                  <tr key={fee.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {editingFee?.id === fee.id ? (
                        <select
                          value={editingFee.warehouse}
                          onChange={(e) => setEditingFee({...editingFee, warehouse: e.target.value})}
                          className="p-2 border rounded w-full"
                        >
                          {warehouses.map((w) => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      ) : (
                        fee.warehouse
                      )}
                    </td>
                    <td className="p-2">
                      {editingFee?.id === fee.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingFee.base_fee}
                          onChange={(e) => setEditingFee({...editingFee, base_fee: e.target.value})}
                          className="p-2 border rounded w-full"
                        />
                      ) : (
                        `€${fee.base_fee}`
                      )}
                    </td>
                    <td className="p-2">
                      {editingFee?.id === fee.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveFee(editingFee)}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFee(null)}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingFee(fee)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFee(fee.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 