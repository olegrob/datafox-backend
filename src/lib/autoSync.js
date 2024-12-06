import { cache } from './cache';

const SYNC_INTERVALS = [0, 6, 12, 18]; // Hours when sync should occur

export function setupAutoSync() {
  // Initial check
  checkAndSync();
  
  // Check every 5 minutes
  setInterval(checkAndSync, 5 * 60 * 1000);
}

async function checkAndSync() {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Get last sync time from cache
  const cachedData = cache.get();
  const lastSync = cachedData?.lastUpdated ? new Date(cachedData.lastUpdated) : null;
  
  // Check if we should sync
  if (shouldSync(currentHour, lastSync)) {
    try {
      const response = await fetch('/api/woocommerce/sync', {
        method: 'POST'
      });
      console.log('Auto sync completed:', new Date().toISOString());
    } catch (error) {
      console.error('Auto sync failed:', error);
    }
  }
}

function shouldSync(currentHour, lastSync) {
  // If no last sync, we should sync
  if (!lastSync) return true;
  
  // Find the next scheduled sync hour
  const currentSyncHour = SYNC_INTERVALS.find(hour => hour >= currentHour) || SYNC_INTERVALS[0];
  
  // Calculate the last sync hour
  const lastSyncHour = lastSync.getHours();
  
  // If we're in a new sync hour and haven't synced yet
  return currentHour >= currentSyncHour && lastSyncHour < currentSyncHour;
} 