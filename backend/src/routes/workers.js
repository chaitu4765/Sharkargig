import express from 'express';
import { query, get, run } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { findSuitableWorkers } from '../utils/matchingEngine.js';

const router = express.Router();

// Smart worker matching search endpoint
router.get('/match', async (req, res) => {
  try {
    const { service_id, lat, lng, is_emergency } = req.query;

    if (!service_id) {
      return res.status(400).json({ success: false, message: 'service_id is required.' });
    }

    const customerLat = parseFloat(lat) || 17.4325;
    const customerLng = parseFloat(lng) || 78.4071;
    const emergencyBool = is_emergency === 'true' || is_emergency === '1';

    const matchedWorkers = await findSuitableWorkers({
      serviceId: parseInt(service_id),
      customerLat,
      customerLng,
      isEmergency: emergencyBool
    });

    return res.json({ success: true, count: matchedWorkers.length, workers: matchedWorkers });
  } catch (error) {
    console.error('Matching Error:', error);
    return res.status(500).json({ success: false, message: 'Worker matching algorithm failed.', error: error.message });
  }
});

// Get current worker profile details
router.get('/me/profile', authenticateToken, requireRole('worker'), async (req, res) => {
  try {
    const worker = await get(
      `SELECT w.*, u.full_name, u.email, u.phone, cs.name as society_name, cs.city as society_city 
       FROM workers w 
       JOIN users u ON w.user_id = u.id 
       JOIN cooperative_societies cs ON w.society_id = cs.id 
       WHERE w.user_id = ?`,
      [req.user.id]
    );

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    const skills = await query(
      `SELECT s.* FROM skills s JOIN worker_skills ws ON s.id = ws.skill_id WHERE ws.worker_id = ?`,
      [worker.id]
    );

    const certifications = await query(
      `SELECT c.name, c.issuing_authority, wc.certificate_no, wc.issue_date, wc.valid_till 
       FROM worker_certifications wc 
       JOIN certifications c ON wc.certification_id = c.id 
       WHERE wc.worker_id = ?`,
      [worker.id]
    );

    const insurance = await query(`SELECT * FROM insurance_records WHERE worker_id = ?`, [worker.id]);
    const welfare = await query(`SELECT * FROM welfare_records WHERE worker_id = ? ORDER BY record_date DESC`, [worker.id]);
    const training = await query(`SELECT * FROM training_records WHERE worker_id = ?`, [worker.id]);

    return res.json({
      success: true,
      worker: {
        ...worker,
        skills,
        certifications,
        insurance: insurance[0] || null,
        welfare,
        training
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch worker profile.', error: error.message });
  }
});

// Toggle worker availability (Online / Offline)
router.put('/availability', authenticateToken, requireRole('worker'), async (req, res) => {
  try {
    const { is_available } = req.body;
    const worker = await get(`SELECT id FROM workers WHERE user_id = ?`, [req.user.id]);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker record not found.' });
    }

    const availableVal = is_available ? 1 : 0;
    await run(`UPDATE workers SET is_available = ? WHERE id = ?`, [availableVal, worker.id]);

    return res.json({
      success: true,
      message: `Availability updated to ${is_available ? 'ONLINE' : 'OFFLINE'}.`,
      is_available: availableVal
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update availability.', error: error.message });
  }
});

// Worker SOS Emergency Trigger
router.post('/sos', authenticateToken, requireRole('worker'), async (req, res) => {
  try {
    const { booking_id, lat, lng } = req.body;

    const worker = await get(
      `SELECT w.id, w.society_id, u.full_name FROM workers w JOIN users u ON w.user_id = u.id WHERE w.user_id = ?`,
      [req.user.id]
    );
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker record not found.' });
    }

    // Insert SOS record
    const sosRes = await run(
      `INSERT INTO sos_alerts (worker_id, booking_id, latitude, longitude, status) VALUES (?, ?, ?, ?, ?)`,
      [worker.id, booking_id || null, lat || 17.4325, lng || 78.4071, 'ACTIVE']
    );

    // Notify Cooperative Admin users
    const coopAdmins = await query(
      `SELECT u.id FROM users u 
       JOIN cooperative_societies cs ON u.email = cs.contact_email 
       WHERE cs.id = ?`,
      [worker.society_id]
    );

    for (const admin of coopAdmins) {
      await run(
        `INSERT INTO notifications (user_id, title, message, type, metadata_json) VALUES (?, ?, ?, ?, ?)`,
        [
          admin.id,
          'EMERGENCY SOS ALERT TRIGGERED!',
          `Worker ${worker.full_name} triggered an SOS emergency signal! Immediate intervention required.`,
          'EMERGENCY',
          JSON.stringify({ sos_id: sosRes.id, worker_id: worker.id, lat, lng })
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'SOS Emergency alert dispatched to Cooperative Admin & Safety Desk.',
      sos_id: sosRes.id
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to trigger SOS alert.', error: error.message });
  }
});

// Worker Earnings Summary
router.get('/earnings', authenticateToken, requireRole('worker'), async (req, res) => {
  try {
    const worker = await get(`SELECT id FROM workers WHERE user_id = ?`, [req.user.id]);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker record not found.' });
    }

    const earningsData = await query(
      `SELECT p.*, b.booking_number, s.name as service_name, b.created_at as service_date
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN services s ON b.service_id = s.id
       WHERE p.worker_id = ? AND p.payment_status = 'SUCCESS'
       ORDER BY p.paid_at DESC`,
      [worker.id]
    );

    const totalEarnings = earningsData.reduce((sum, item) => sum + item.amount, 0);

    return res.json({
      success: true,
      total_earnings: totalEarnings,
      transactions_count: earningsData.length,
      transactions: earningsData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch earnings.', error: error.message });
  }
});

export default router;
