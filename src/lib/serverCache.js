// Simple in-memory cache for server-side
let serverCache = new Map();

export const ServerCache = {
  set: (key, data) => {
    serverCache.set(key, {
      data,
      timestamp: Date.now()
    });
  },

  get: (key) => {
    const cached = serverCache.get(key);
    if (!cached) return null;

    const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      serverCache.delete(key);
      return null;
    }

    return cached.data;
  },

  clear: (key) => {
    if (key) {
      serverCache.delete(key);
    } else {
      serverCache.clear();
    }
  }
}; 