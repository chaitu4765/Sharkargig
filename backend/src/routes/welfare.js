import express from 'express';
import { query, get, run } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get welfare overview for logged in worker or specific worker
router.get('/worker/:worker_id?', authenticateToken, async (req, res) => {
  try {
    let workerId = req.params.worker_id;

    if (!workerId && req.user.role === 'worker') {
      const worker = await get(`SELECT id FROM workers WHERE user_id = ?`, [req.user.id]);
      if (worker) workerId = worker.id;
    }

    if (!workerId) {
      return res.status(400).json({ success: false, message: 'worker_id is required.' });
    }

    const worker = await get(
      `SELECT w.*, u.full_name, cs.name as society_name 
       FROM workers w 
       JOIN users u ON w.user_id = u.id 
       JOIN cooperative_societies cs ON w.society_id = cs.id 
       WHERE w.id = ?`,
      [workerId]
    );

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const insurance = await query(`SELECT * FROM insurance_records WHERE worker_id = ?`, [workerId]);
    const welfareContributions = await query(`SELECT * FROM welfare_records WHERE worker_id = ? ORDER BY record_date DESC`, [workerId]);
    const trainingPrograms = await query(`SELECT * FROM training_records WHERE worker_id = ? ORDER BY id DESC`, [workerId]);

    const totalContributions = welfareContributions.reduce((sum, item) => sum + item.contribution_amount, 0);

    return res.json({
      success: true,
      worker_name: worker.full_name,
      society_name: worker.society_name,
      insurance: insurance[0] || {
        provider: 'National Labour Cooperative Insurance Scheme (Cooperative Managed)',
        policy_number: 'NLC-POL-DEMO-001',
        coverage_amount: 500000.0,
        status: 'ACTIVE',
        valid_till: '2027-12-31'
      },
      total_welfare_contributions: totalContributions,
      welfare_contributions: welfareContributions,
      training_programs: trainingPrograms
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch welfare records.', error: error.message });
  }
});

// Admin Add Welfare or Training Record
router.post('/training', authenticateToken, requireRole('coop_admin', 'federation_admin'), async (req, res) => {
  try {
    const { worker_id, course_name, status, recommended_by } = req.body;

    if (!worker_id || !course_name) {
      return res.status(400).json({ success: false, message: 'worker_id and course_name are required.' });
    }

    const resObj = await run(
      `INSERT INTO training_records (worker_id, course_name, status, recommended_by) VALUES (?, ?, ?, ?)`,
      [worker_id, course_name, status || 'RECOMMENDED', recommended_by || 'Cooperative Administration']
    );

    return res.status(201).json({ success: true, message: 'Training record added successfully.', id: resObj.id });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add training record.', error: error.message });
  }
});

export default router;
