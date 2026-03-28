const db = require('../config/db');

const Applicant = {
  async create(data) {
    const {
      name, email, phone, date_of_birth, gender,
      category, entry_type, quota_type, marks,
      allotment_number, address, document_status
    } = data;

    const [result] = await db.execute(
      `INSERT INTO applicants
       (name, email, phone, date_of_birth, gender, category, entry_type,
        quota_type, marks, allotment_number, address, document_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email || null, phone || null, date_of_birth || null, gender || null,
       category, entry_type, quota_type, marks || null,
       allotment_number || null, address || null, document_status || 'Pending']
    );
    return result.insertId;
  },

  async findAll() {
    const [rows] = await db.execute(
      `SELECT a.*, adm.id AS admission_id, adm.status AS admission_status
       FROM applicants a
       LEFT JOIN admissions adm ON adm.applicant_id = a.id
       ORDER BY a.created_at DESC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM applicants WHERE id = ?', [id]
    );
    return rows[0] || null;
  },

  // Update only document_status
  async updateDocumentStatus(id, status) {
    await db.execute(
      'UPDATE applicants SET document_status = ? WHERE id = ?',
      [status, id]
    );
  },

  // Applicants not yet allocated (no admission record)
  async findUnallocated() {
    const [rows] = await db.execute(
      `SELECT a.* FROM applicants a
       LEFT JOIN admissions adm ON adm.applicant_id = a.id
       WHERE adm.id IS NULL
       ORDER BY a.created_at DESC`
    );
    return rows;
  },
};

module.exports = Applicant;
