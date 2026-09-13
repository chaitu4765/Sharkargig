import express from 'express';
import { query, get, run } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Cooperative Admin Dashboard KPIs & Worker Management
router.get('/dashboard', authenticateToken, requireRole('coop_admin', 'federation_admin'), async (req, res) => {
  try {
    let societyFilter = '';
    const params = [];

    if (req.user.role === 'coop_admin') {
      const coop = await get(`SELECT id FROM cooperative_societies WHERE contact_email = ?`, [req.user.email]);
      if (coop) {
        societyFilter = ` WHERE society_id = ?`;
        params.push(coop.id);
      }
    }

    const totalWorkers = await get(`SELECT COUNT(*) as count FROM workers ${societyFilter}`, params);
    const verifiedWorkers = await get(`SELECT COUNT(*) as count FROM workers WHERE verification_status = 'VERIFIED' ${societyFilter ? 'AND society_id = ?' : ''}`, params);
    const pendingWorkers = await get(`SELECT COUNT(*) as count FROM workers WHERE verification_status = 'PENDING' ${societyFilter ? 'AND society_id = ?' : ''}`, params);
    
    const activeJobs = await get(`SELECT COUNT(*) as count FROM bookings WHERE status IN ('CONFIRMED', 'WORKER_ON_THE_WAY', 'IN_PROGRESS') ${societyFilter ? 'AND society_id = ?' : ''}`, params);
    const completedJobs = await get(`SELECT COUNT(*) as count FROM bookings WHERE status = 'COMPLETED' ${societyFilter ? 'AND society_id = ?' : ''}`, params);
    const cancelledJobs = await get(`SELECT COUNT(*) as count FROM bookings WHERE status = 'CANCELLED' ${societyFilter ? 'AND society_id = ?' : ''}`, params);
    const emergencyJobs = await get(`SELECT COUNT(*) as count FROM bookings WHERE is_emergency = 1 ${societyFilter ? 'AND society_id = ?' : ''}`, params);

    const revenueData = await get(`SELECT SUM(total_amount) as total FROM bookings WHERE payment_status = 'SUCCESS' ${societyFilter ? 'AND society_id = ?' : ''}`, params);
    const totalRevenue = revenueData.total || 0;

    // Service Demand Breakdown
    const serviceDemand = await query(
      `SELECT s.name as service_name, COUNT(b.id) as booking_count 
       FROM bookings b 
       JOIN services s ON b.service_id = s.id 
       ${societyFilter ? 'WHERE b.society_id = ?' : ''}
       GROUP BY s.id ORDER BY booking_count DESC LIMIT 6`,
      params
    );

    // Active Emergency SOS alerts
    const activeSOS = await query(
      `SELECT sos.*, u.full_name as worker_name, u.phone as worker_phone, cs.name as society_name
       FROM sos_alerts sos
       JOIN workers w ON sos.worker_id = w.id
       JOIN users u ON w.user_id = u.id
       JOIN cooperative_societies cs ON w.society_id = cs.id
       WHERE sos.status = 'ACTIVE'
       ORDER BY sos.triggered_at DESC`
    );

    return res.json({
      success: true,
      kpi: {
        total_workers: totalWorkers.count,
        verified_workers: verifiedWorkers.count,
        pending_workers: pendingWorkers.count,
        active_jobs: activeJobs.count,
        completed_jobs: completedJobs.count,
        cancelled_jobs: cancelledJobs.count,
        emergency_jobs: emergencyJobs.count,
        total_revenue: totalRevenue,
        worker_earnings: Math.round(totalRevenue * 0.85) // 85% passed to workers
      },
      service_demand: serviceDemand,
      active_sos: activeSOS
    });
  } catch (error) {
    console.error('Coop Dashboard Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.', error: error.message });
  }
});

// List Workers for Cooperative Management (with Verification Status filter)
router.get('/workers', authenticateToken, requireRole('coop_admin', 'federation_admin'), async (req, res) => {
  try {
    const { status, society_id } = req.query;
    let sql = `
      SELECT w.*, u.full_name, u.email, u.phone, u.created_at as registered_date, cs.name as society_name 
      FROM workers w
      JOIN users u ON w.user_id = u.id
      JOIN cooperative_societies cs ON w.society_id = cs.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ` AND w.verification_status = ?`;
      params.push(status);
    }

    if (society_id) {
      sql += ` AND w.society_id = ?`;
      params.push(society_id);
    }

    sql += ` ORDER BY w.created_at DESC`;
    const workers = await query(sql, params);

    return res.json({ success: true, count: workers.length, workers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch worker list.', error: error.message });
  }
});

// Verify, Reject, or Suspend Worker Account
router.put('/workers/:id/verification', authenticateToken, requireRole('coop_admin', 'federation_admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const workerId = req.params.id;

    if (!['VERIFIED', 'REJECTED', 'SUSPENDED', 'PENDING'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status.' });
    }

    const worker = await get(`SELECT w.*, u.id as user_id, u.full_name FROM workers w JOIN users u ON w.user_id = u.id WHERE w.id = ?`, [workerId]);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker record not found.' });
    }

    await run(`UPDATE workers SET verification_status = ? WHERE id = ?`, [status, workerId]);

    // Send notification to worker
    await run(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [
        worker.user_id,
        `Cooperative Account Verification: ${status}`,
        `Your worker account status has been updated to ${status}. ${notes ? 'Notes: ' + notes : ''}`,
        'VERIFICATION_UPDATE'
      ]
    );

    return res.json({
      success: true,
      message: `Worker ${worker.full_name} status updated to ${status}.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update verification status.', error: error.message });
  }
});

// Federation Multi-Society Overview
router.get('/federation/societies', authenticateToken, requireRole('federation_admin'), async (req, res) => {
  try {
    const societies = await query(`
      SELECT cs.*, f.name as federation_name,
             (SELECT COUNT(*) FROM workers w WHERE w.society_id = cs.id) as total_workers,
             (SELECT COUNT(*) FROM workers w WHERE w.society_id = cs.id AND w.verification_status = 'VERIFIED') as verified_workers,
             (SELECT COUNT(*) FROM bookings b WHERE b.society_id = cs.id) as total_bookings,
             (SELECT COALESCE(SUM(total_amount), 0) FROM bookings b WHERE b.society_id = cs.id AND b.payment_status = 'SUCCESS') as total_revenue
      FROM cooperative_societies cs
      JOIN federations f ON cs.federation_id = f.id
      ORDER BY cs.name ASC
    `);

    return res.json({ success: true, count: societies.length, societies });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch federation societies.', error: error.message });
  }
});

export default router;
