const db = require('../config/db');

const Program = {
  // Create a new program (without quotas)
  async create(data) {
    const { institution_name, campus_name, department_name, program_name,
            course_type, entry_type, academic_year, total_intake } = data;
    const [result] = await db.execute(
      `INSERT INTO programs 
       (institution_name, campus_name, department_name, program_name, course_type, entry_type, academic_year, total_intake)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [institution_name, campus_name, department_name, program_name,
       course_type, entry_type, academic_year || '2026', total_intake]
    );
    return result.insertId;
  },

  async findAll() {
    const [rows] = await db.execute(
      `SELECT p.*, 
        COALESCE(SUM(q.filled_seats), 0) AS total_filled
       FROM programs p
       LEFT JOIN quotas q ON q.program_id = p.id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM programs WHERE id = ?', [id]
    );
    return rows[0] || null;
  },
};

module.exports = Program;
