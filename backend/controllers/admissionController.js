const Admission = require('../models/Admission');
const Applicant = require('../models/Applicant');
const Quota = require('../models/Quota');
const db = require('../config/db');

// POST /api/admissions/allocate
// CRITICAL LOGIC: Check quota → lock seat → create record atomically
const allocateSeat = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { applicant_id, program_id, quota_id } = req.body;

    if (!applicant_id || !program_id || !quota_id) {
      return res.status(400).json({ error: 'applicant_id, program_id, quota_id are required' });
    }

    // Check applicant exists
    const applicant = await Applicant.findById(applicant_id);
    if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

    // Check applicant not already allocated
    const existing = await Admission.findByApplicant(applicant_id);
    if (existing) {
      return res.status(409).json({ error: 'Applicant already has a seat allocated' });
    }

    // Start transaction — seat lock happens inside incrementFilled
    await conn.beginTransaction();

    // CRITICAL: Try to increment filled_seats.
    // Returns false if quota is already full (filled_seats >= total_seats).
    const locked = await Quota.incrementFilled(quota_id, conn);
    if (!locked) {
      await conn.rollback();
      return res.status(409).json({ error: 'Quota is full. Seat allocation blocked.' });
    }

    // Seat is now locked — create admission record
    const [result] = await conn.execute(
      `INSERT INTO admissions (applicant_id, program_id, quota_id, fee_status, status)
       VALUES (?, ?, ?, 'Pending', 'allocated')`,
      [applicant_id, program_id, quota_id]
    );

    await conn.commit();
    return res.status(201).json({
      message: 'Seat allocated and locked successfully',
      admissionId: result.insertId
    });
  } catch (err) {
    await conn.rollback();
    // MySQL duplicate key = applicant already allocated (race condition safety)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Applicant already has a seat allocated' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Server error during allocation' });
  } finally {
    conn.release();
  }
};

// POST /api/admissions/:id/confirm
// CRITICAL LOGIC: doc=Verified AND fee=Paid → generate unique admission number
const confirmAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) return res.status(404).json({ error: 'Admission record not found' });

    if (admission.status === 'confirmed') {
      return res.status(409).json({ error: 'Admission already confirmed', admission_number: admission.admission_number });
    }

    // RULE: document must be Verified
    if (admission.document_status !== 'Verified') {
      return res.status(400).json({
        error: `Document status must be Verified. Current: ${admission.document_status}`
      });
    }

    // RULE: fee must be Paid
    if (admission.fee_status !== 'Paid') {
      return res.status(400).json({
        error: 'Fee must be Paid before confirmation'
      });
    }

    // Generate immutable admission number inside a transaction
    const admNo = await Admission.confirm(req.params.id);

    return res.json({
      message: 'Admission confirmed',
      admission_number: admNo
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error during confirmation' });
  }
};

// PATCH /api/admissions/:id/fee-status
const updateFeeStatus = async (req, res) => {
  try {
    const { fee_status } = req.body;
    if (!['Pending', 'Paid'].includes(fee_status)) {
      return res.status(400).json({ error: 'fee_status must be Pending or Paid' });
    }

    const admission = await Admission.findById(req.params.id);
    if (!admission) return res.status(404).json({ error: 'Admission not found' });

    await Admission.updateFeeStatus(req.params.id, fee_status);
    return res.json({ message: 'Fee status updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/admissions
const getAllAdmissions = async (req, res) => {
  try {
    const admissions = await Admission.findAll();
    return res.json(admissions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/admissions/:id
const getAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) return res.status(404).json({ error: 'Not found' });
    return res.json(admission);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    const data = await Admission.getDashboardData();
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  allocateSeat,
  confirmAdmission,
  updateFeeStatus,
  getAllAdmissions,
  getAdmission,
  getDashboard,
};
