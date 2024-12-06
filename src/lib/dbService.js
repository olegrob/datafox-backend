import { getDb } from './db';

// Shared database service for all routes
export const dbService = {
  async query(sql, params = []) {
    const connection = await getDb();
    try {
      return await connection.sql(sql, params);
    } catch (error) {
      console.error('Database query error:', { sql, params, error: error.message });
      throw error;
    }
  },

  async queryOne(sql, params = []) {
    const results = await this.query(sql, params);
    return results[0] || null;
  },

  async transaction(callback) {
    const connection = await getDb();
    try {
      await connection.sql('BEGIN TRANSACTION');
      const result = await callback(connection);
      await connection.sql('COMMIT');
      return result;
    } catch (error) {
      await connection.sql('ROLLBACK');
      throw error;
    }
  }
}; 