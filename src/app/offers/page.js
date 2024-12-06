'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/lib/cartContext';
import Link from 'next/link';

export default function OffersPage() {
  const { data: session } = useSession();
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/offers');
      if (!response.ok) throw new Error('Failed to fetch offers');
      const data = await response.json();
      setOffers(data.offers);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view offers</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Offers</h1>
        <Link
          href="/offers/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create New Offer
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No offers found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}

function OfferCard({ offer }) {
  const products = JSON.parse(offer.products);
  const formattedDate = new Date(offer.created_at).toLocaleDateString();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">{offer.name}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          offer.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
          offer.status === 'sent' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {offer.status}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4">{offer.description}</p>
      
      <div className="mb-4">
        <div className="text-sm text-gray-500">Products: {products.length}</div>
        <div className="text-sm text-gray-500">Total: €{offer.total_price}</div>
        <div className="text-sm text-gray-500">Created: {formattedDate}</div>
      </div>

      <div className="flex justify-between items-center">
        <Link
          href={`/offers/${offer.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details
        </Link>
        
        {offer.status === 'draft' && (
          <button
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
          >
            Send Offer
          </button>
        )}
      </div>
    </div>
  );
} 