export default function AttributesList({ attributes = [], onEdit, onRefresh }) {
  if (!attributes.length) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-8 text-center">
        <p className="text-gray-500">No attributes found. Add your first attribute to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Original Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              EE Translation
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {attributes.map((attribute) => (
            <tr key={attribute.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {attribute.original_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {attribute.ee_translation}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {attribute.attribute_type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button
                  onClick={() => onEdit(attribute)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 