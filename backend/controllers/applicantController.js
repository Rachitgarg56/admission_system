const Applicant = require('../models/Applicant');

// POST /api/applicants
const createApplicant = async (req, res) => {
  try {
    const {
      name, email, phone, date_of_birth, gender,
      category, entry_type, quota_type, marks,
      allotment_number, address
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!category) return res.status(400).json({ error: 'Category is required' });
    if (!quota_type) return res.status(400).json({ error: 'Quota type is required' });
    if (!entry_type) return res.status(400).json({ error: 'Entry type is required' });

    // For government quotas, allotment number is required
    if ((quota_type === 'KCET' || quota_type === 'COMEDK') && !allotment_number) {
      return res.status(400).json({
        error: `Allotment number is required for ${quota_type} quota`
      });
    }

    const id = await Applicant.create({
      name, email, phone, date_of_birth, gender,
      category, entry_type, quota_type, marks,
      allotment_number, address, document_status: 'Pending'
    });

    return res.status(201).json({ message: 'Applicant created', applicantId: id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/applicants
const getAllApplicants = async (req, res) => {
  try {
    const applicants = await Applicant.findAll();
    return res.json(applicants);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/applicants/unallocated
const getUnallocated = async (req, res) => {
  try {
    const applicants = await Applicant.findUnallocated();
    return res.json(applicants);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/applicants/:id/document-status
const updateDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Submitted', 'Verified'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid document status' });
    }
    await Applicant.updateDocumentStatus(req.params.id, status);
    return res.json({ message: 'Document status updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createApplicant, getAllApplicants, getUnallocated, updateDocumentStatus };
