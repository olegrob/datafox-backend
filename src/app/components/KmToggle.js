'use client';

export default function KmToggle({ showTax, setShowTax }) {
  return (
    <button
      onClick={() => setShowTax(!showTax)}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors
        ${showTax 
          ? 'bg-blue-600 text-white hover:bg-blue-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
    >
      KM {showTax ? 'ON' : 'OFF'}
    </button>
  );
} 