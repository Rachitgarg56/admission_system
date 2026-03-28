const express = require('express');
const router = express.Router();

const { createProgram, getAllPrograms, getProgramQuotas } = require('../controllers/programController');
const { createApplicant, getAllApplicants, getUnallocated, updateDocumentStatus } = require('../controllers/applicantController');
const { allocateSeat, confirmAdmission, updateFeeStatus, getAllAdmissions, getAdmission, getDashboard } = require('../controllers/admissionController');

// Programs
router.post('/programs', createProgram);
router.get('/programs', getAllPrograms);
router.get('/programs/:id/quotas', getProgramQuotas);

// Applicants
router.post('/applicants', createApplicant);
router.get('/applicants', getAllApplicants);
router.get('/applicants/unallocated', getUnallocated);
router.patch('/applicants/:id/document-status', updateDocumentStatus);

// Admissions
router.post('/admissions/allocate', allocateSeat);
router.get('/admissions', getAllAdmissions);
router.get('/admissions/:id', getAdmission);
router.patch('/admissions/:id/fee-status', updateFeeStatus);
router.post('/admissions/:id/confirm', confirmAdmission);

// Dashboard
router.get('/dashboard', getDashboard);

module.exports = router;
