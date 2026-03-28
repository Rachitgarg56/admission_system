const db = require('../config/db');

const Admission = {
  // Create an admission record (status = 'allocated')
  async create({ applicant_id, program_id, quota_id }) {
    const [result] = await db.execute(
      `INSERT INTO admissions (applicant_id, program_id, quota_id, fee_status, status)
       VALUES (?, ?, ?, 'Pending', 'allocated')`,
      [applicant_id, program_id, quota_id]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT adm.*, 
              a.name AS applicant_name, a.document_status,
              p.program_name, p.course_type, p.academic_year,
              p.institution_name,
              q.quota_type
       FROM admissions adm
       JOIN applicants a ON a.id = adm.applicant_id
       JOIN programs p ON p.id = adm.program_id
       JOIN quotas q ON q.id = adm.quota_id
       WHERE adm.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByApplicant(applicantId) {
    const [rows] = await db.execute(
      `SELECT adm.*, 
              p.program_name, p.course_type, p.institution_name,
              q.quota_type
       FROM admissions adm
       JOIN programs p ON p.id = adm.program_id
       JOIN quotas q ON q.id = adm.quota_id
       WHERE adm.applicant_id = ?`,
      [applicantId]
    );
    return rows[0] || null;
  },

  async findAll() {
    const [rows] = await db.execute(
      `SELECT adm.*, 
              a.name AS applicant_name, a.document_status, a.category,
              p.program_name, p.course_type, p.institution_name,
              q.quota_type
       FROM admissions adm
       JOIN applicants a ON a.id = adm.applicant_id
       JOIN programs p ON p.id = adm.program_id
       JOIN quotas q ON q.id = adm.quota_id
       ORDER BY adm.created_at DESC`
    );
    return rows;
  },

  async updateFeeStatus(id, fee_status) {
    await db.execute(
      'UPDATE admissions SET fee_status = ? WHERE id = ?',
      [fee_status, id]
    );
  },

  // CRITICAL: Generate admission number — called only once on confirmation.
  // Format: INST/2026/UG/CSE/KCET/0001
  // Sequence is scoped per program + quota + year to avoid collisions.
  async confirm(id) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Lock the row while we generate the number
      const [rows] = await conn.execute(
        `SELECT adm.*, 
                p.program_name, p.course_type, p.academic_year,
                q.quota_type
         FROM admissions adm
         JOIN programs p ON p.id = adm.program_id
         JOIN quotas q ON q.id = adm.quota_id
         WHERE adm.id = ? FOR UPDATE`,
        [id]
      );
      const adm = rows[0];

      if (!adm) throw new Error('Admission record not found');
      if (adm.status === 'confirmed') throw new Error('Already confirmed');
      if (adm.admission_number) throw new Error('Admission number already exists');

      // Get next sequence for this program+quota+year combination
      const [seqRows] = await conn.execute(
        `SELECT COUNT(*) AS cnt FROM admissions
         WHERE program_id = ? AND quota_id = ? AND status = 'confirmed'`,
        [adm.program_id, adm.quota_id]
      );
      const seq = (seqRows[0].cnt + 1).toString().padStart(4, '0');

      // Build: INST/2026/UG/CSE/KCET/0001
      const admNo = `INST/${adm.academic_year}/${adm.course_type}/${adm.program_name}/${adm.quota_type}/${seq}`;

      await conn.execute(
        `UPDATE admissions SET status = 'confirmed', admission_number = ? WHERE id = ?`,
        [admNo, id]
      );

      await conn.commit();
      return admNo;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Dashboard aggregates
  async getDashboardData() {
    const [programStats] = await db.execute(
      `SELECT p.id, p.program_name, p.institution_name, p.total_intake,
              COALESCE(SUM(q.filled_seats), 0) AS total_filled
       FROM programs p
       LEFT JOIN quotas q ON q.program_id = p.id
       GROUP BY p.id`
    );

    const [quotaStats] = await db.execute(
      `SELECT p.program_name, q.quota_type, q.total_seats, q.filled_seats,
              (q.total_seats - q.filled_seats) AS remaining
       FROM quotas q
       JOIN programs p ON p.id = q.program_id
       ORDER BY p.program_name, q.quota_type`
    );

    const [pendingDocs] = await db.execute(
      `SELECT a.id, a.name, a.document_status, p.program_name, q.quota_type
       FROM admissions adm
       JOIN applicants a ON a.id = adm.applicant_id
       JOIN programs p ON p.id = adm.program_id
       JOIN quotas q ON q.id = adm.quota_id
       WHERE a.document_status != 'Verified'
       ORDER BY a.document_status`
    );

    const [pendingFees] = await db.execute(
      `SELECT a.id, a.name, adm.id AS admission_id, adm.fee_status,
              p.program_name, q.quota_type
       FROM admissions adm
       JOIN applicants a ON a.id = adm.applicant_id
       JOIN programs p ON p.id = adm.program_id
       JOIN quotas q ON q.id = adm.quota_id
       WHERE adm.fee_status = 'Pending'
       ORDER BY adm.created_at`
    );

    return { programStats, quotaStats, pendingDocs, pendingFees };
  },
};

module.exports = Admission;
