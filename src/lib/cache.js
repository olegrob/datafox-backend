import { ServerCache } from './serverCache';

const CACHE_KEY = 'woocommerce_dashboard_stats';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

export const cache = {
  set: (data) => {
    const cacheData = {
      timestamp: Date.now(),
      data
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (error) {
        console.error('Error setting client cache:', error);
      }
    }

    ServerCache.set(CACHE_KEY, data);
  },

  get: () => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (Date.now() - parsedCache.timestamp <= CACHE_DURATION) {
            return parsedCache.data;
          }
          localStorage.removeItem(CACHE_KEY);
        }
      }

      return ServerCache.get(CACHE_KEY);
    } catch (error) {
      console.error('Cache error:', error);
      return null;
    }
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch (error) {
        console.error('Error clearing client cache:', error);
      }
    }
    ServerCache.clear(CACHE_KEY);
  }
}; 