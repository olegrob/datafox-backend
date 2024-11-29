'use client';

import { useState, useEffect } from 'react';

export default function AttributeModal({ attribute, onClose, onSave }) {
  const [formData, setFormData] = useState({
    original_name: '',
    ee_translation: '',
    en_translation: '',
    ru_translation: '',
    attribute_type: 'text',
    is_active: true
  });

  useEffect(() => {
    if (attribute) {
      setFormData({
        original_name: attribute.original_name || '',
        ee_translation: attribute.ee_translation || '',
        en_translation: attribute.en_translation || '',
        ru_translation: attribute.ru_translation || '',
        attribute_type: attribute.attribute_type || 'text',
        is_active: attribute.is_active ?? true
      });
    }
  }, [attribute]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = '/api/attributes';
      const method = attribute ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attribute ? { ...formData, id: attribute.id } : formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save attribute');
      }

      onSave();
    } catch (error) {
      console.error('Error saving attribute:', error);
      // You might want to add error handling UI here
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {attribute ? 'Edit Attribute' : 'New Attribute'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Name
            </label>
            <input
              type="text"
              value={formData.original_name}
              onChange={(e) => setFormData({ ...formData, original_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
              disabled={!!attribute}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estonian Translation
            </label>
            <input
              type="text"
              value={formData.ee_translation}
              onChange={(e) => setFormData({ ...formData, ee_translation: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              English Translation
            </label>
            <input
              type="text"
              value={formData.en_translation}
              onChange={(e) => setFormData({ ...formData, en_translation: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Russian Translation
            </label>
            <input
              type="text"
              value={formData.ru_translation}
              onChange={(e) => setFormData({ ...formData, ru_translation: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attribute Type
            </label>
            <select
              value={formData.attribute_type}
              onChange={(e) => setFormData({ ...formData, attribute_type: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="date">Date</option>
              <option value="url">URL</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 