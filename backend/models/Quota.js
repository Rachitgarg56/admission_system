const db = require('../config/db');

const Quota = {
  // Create quotas for a program — called after program is created
  // quotas: [{ quota_type, total_seats }]
  async createMany(programId, quotas) {
    const values = quotas.map(q => [programId, q.quota_type, q.total_seats, 0]);
    await db.query(
      'INSERT INTO quotas (program_id, quota_type, total_seats, filled_seats) VALUES ?',
      [values]
    );
  },

  async findByProgram(programId) {
    const [rows] = await db.execute(
      'SELECT * FROM quotas WHERE program_id = ? ORDER BY quota_type',
      [programId]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM quotas WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // CRITICAL: Increment filled_seats atomically.
  // Uses WHERE clause to ensure we never exceed total_seats (double safety).
  async incrementFilled(quotaId, conn) {
    const executor = conn || db;
    const [result] = await executor.execute(
      `UPDATE quotas 
       SET filled_seats = filled_seats + 1 
       WHERE id = ? AND filled_seats < total_seats`,
      [quotaId]
    );
    // affectedRows = 0 means quota was full — allocation must be blocked
    return result.affectedRows > 0;
  },
};

module.exports = Quota;
