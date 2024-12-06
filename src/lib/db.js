import { Database } from '@sqlitecloud/drivers';

class ConnectionPool {
  constructor(maxSize = 5) {
    if (ConnectionPool.instance) {
      return ConnectionPool.instance;
    }
    this.maxSize = maxSize;
    this.activeConnections = 0;
    this.mainConnection = null;
    this.lastUsed = Date.now();
    this.isInitializing = false;
    this.connectionQueue = [];
    ConnectionPool.instance = this;
  }

  async getConnection() {
    try {
      // If we have a main connection and it's alive, use it
      if (this.mainConnection) {
        try {
          await this.mainConnection.sql('SELECT 1');
          this.lastUsed = Date.now();
          return this.mainConnection;
        } catch (error) {
          console.log('Main connection dead, creating new one');
          this.mainConnection = null;
        }
      }

      // If we're already initializing, queue the request
      if (this.isInitializing) {
        return new Promise((resolve, reject) => {
          this.connectionQueue.push({ resolve, reject });
        });
      }

      this.isInitializing = true;

      try {
        this.mainConnection = await this.createConnection();
        this.lastUsed = Date.now();
        
        // Resolve any queued requests
        while (this.connectionQueue.length > 0) {
          const { resolve } = this.connectionQueue.shift();
          resolve(this.mainConnection);
        }

        return this.mainConnection;
      } catch (error) {
        // Reject any queued requests
        while (this.connectionQueue.length > 0) {
          const { reject } = this.connectionQueue.shift();
          reject(error);
        }
        throw error;
      } finally {
        this.isInitializing = false;
      }
    } catch (error) {
      console.error('Error getting connection:', error);
      throw error;
    }
  }

  async createConnection() {
    try {
      const connection = new Database('sqlitecloud://cwwcqlv7nk.sqlite.cloud:8860?apikey=AaNIeaKIdCsKAeNXUXeXLaTMpKCnKWqAysZXgZlBhzU');
      await connection.sql('USE DATABASE products');
      return connection;
    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  }

  async closeAll() {
    if (this.mainConnection) {
      try {
        await this.mainConnection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      } finally {
        this.mainConnection = null;
      }
    }
  }
}

const pool = new ConnectionPool();

// Singleton wrapper for database access
export async function getDb() {
  try {
    const connection = await pool.getConnection();
    await connection.sql('USE DATABASE products');
    return connection;
  } catch (error) {
    console.error('Failed to get database connection:', error);
    throw error;
  }
}

export async function closeConnection() {
  await pool.closeAll();
}

// Auto-cleanup idle connections
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  if (pool.mainConnection && Date.now() - pool.lastUsed > IDLE_TIMEOUT) {
    console.log('Closing idle connection');
    pool.closeAll();
  }
}, 60000); // Check every minute

// Cleanup on process exit
process.on('SIGTERM', () => pool.closeAll());
process.on('SIGINT', () => pool.closeAll());

// Initialize main connection
getDb().catch(error => {
  console.error('Failed to initialize database connection:', error);
});
