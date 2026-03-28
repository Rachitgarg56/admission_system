const Program = require('../models/Program');
const Quota = require('../models/Quota');

// POST /api/programs
// Body: { institution_name, campus_name, department_name, program_name,
//         course_type, entry_type, total_intake,
//         quotas: [{ quota_type, total_seats }] }
const createProgram = async (req, res) => {
  try {
    const { institution_name, campus_name, department_name, program_name,
            course_type, entry_type, total_intake, quotas } = req.body;

    // --- Validation ---
    if (!institution_name || !campus_name || !department_name || !program_name) {
      return res.status(400).json({ error: 'All institution/campus/department/program fields are required' });
    }
    if (!total_intake || total_intake <= 0) {
      return res.status(400).json({ error: 'Total intake must be a positive number' });
    }
    if (!quotas || !Array.isArray(quotas) || quotas.length === 0) {
      return res.status(400).json({ error: 'At least one quota must be defined' });
    }

    // RULE: sum of quota seats must equal total_intake
    const quotaSum = quotas.reduce((sum, q) => sum + Number(q.total_seats), 0);
    if (quotaSum !== Number(total_intake)) {
      return res.status(400).json({
        error: `Quota seats sum (${quotaSum}) must equal total intake (${total_intake})`
      });
    }

    // Prevent duplicate quota types in the same request
    const types = quotas.map(q => q.quota_type);
    if (new Set(types).size !== types.length) {
      return res.status(400).json({ error: 'Duplicate quota types are not allowed' });
    }

    const programId = await Program.create({
      institution_name, campus_name, department_name, program_name,
      course_type, entry_type, total_intake
    });

    await Quota.createMany(programId, quotas);

    return res.status(201).json({ message: 'Program created', programId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/programs
const getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.findAll();
    return res.json(programs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/programs/:id/quotas
const getProgramQuotas = async (req, res) => {
  try {
    const quotas = await Quota.findByProgram(req.params.id);
    return res.json(quotas);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createProgram, getAllPrograms, getProgramQuotas };
