import express from 'express';
import { query, get, run } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Generate unique booking number
const generateBookingNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `BOOK-2026-${timestamp}${random}`;
};

// Create a new booking (Customer)
router.post('/', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    const { worker_id, service_id, scheduled_date, scheduled_time, service_address, customer_lat, customer_lng, problem_description, is_emergency } = req.body;

    if (!service_id || !scheduled_date || !scheduled_time || !service_address) {
      return res.status(400).json({ success: false, message: 'Service, date, time, and address are required.' });
    }

    const customer = await get(`SELECT id FROM customers WHERE user_id = ?`, [req.user.id]);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer record not found.' });
    }

    const service = await get(`SELECT * FROM services WHERE id = ?`, [service_id]);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service does not exist.' });
    }

    let assignedWorkerId = worker_id ? parseInt(worker_id) : null;
    let societyId = 1; // Default to central coop

    // If explicit worker requested, verify worker availability and prevent double booking
    if (assignedWorkerId) {
      const worker = await get(
        `SELECT w.*, u.full_name FROM workers w JOIN users u ON w.user_id = u.id WHERE w.id = ? AND w.verification_status = 'VERIFIED'`,
        [assignedWorkerId]
      );
      if (!worker) {
        return res.status(400).json({ success: false, message: 'Selected worker is unavailable or unverified.' });
      }

      societyId = worker.society_id;

      // CONCURRENCY CHECK: Verify worker is not already double-booked in this slot
      const existingSlot = await get(
        `SELECT id FROM bookings 
         WHERE worker_id = ? AND scheduled_date = ? AND scheduled_time = ? 
         AND status IN ('CONFIRMED', 'WORKER_ON_THE_WAY', 'IN_PROGRESS', 'PENDING_WORKER_ACCEPTANCE')`,
        [assignedWorkerId, scheduled_date, scheduled_time]
      );

      if (existingSlot) {
        return res.status(409).json({
          success: false,
          message: 'Selected worker is already booked for this specific time slot. Please choose another time or worker.'
        });
      }
    }

    const bookingNumber = generateBookingNumber();
    const baseAmount = service.base_price;
    const isEmergencyVal = is_emergency ? 1 : 0;
    const totalAmount = isEmergencyVal ? baseAmount + 150 : baseAmount; // Emergency priority fee

    const bookingRes = await run(
      `INSERT INTO bookings (booking_number, customer_id, worker_id, service_id, society_id, status, is_emergency, customer_lat, customer_lng, service_address, scheduled_date, scheduled_time, problem_description, base_amount, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingNumber,
        customer.id,
        assignedWorkerId,
        service.id,
        societyId,
        'PENDING_WORKER_ACCEPTANCE',
        isEmergencyVal,
        customer_lat || 17.4325,
        customer_lng || 78.4071,
        service_address,
        scheduled_date,
        scheduled_time,
        problem_description || '',
        baseAmount,
        totalAmount
      ]
    );

    // Record initial status history
    await run(
      `INSERT INTO booking_status_history (booking_id, status, notes, changed_by_user_id) VALUES (?, ?, ?, ?)`,
      [bookingRes.id, 'PENDING_WORKER_ACCEPTANCE', 'Booking request created by customer.', req.user.id]
    );

    // Send notification to worker if assigned
    if (assignedWorkerId) {
      const workerUser = await get(`SELECT user_id FROM workers WHERE id = ?`, [assignedWorkerId]);
      if (workerUser) {
        await run(
          `INSERT INTO notifications (user_id, title, message, type, metadata_json) VALUES (?, ?, ?, ?, ?)`,
          [
            workerUser.user_id,
            isEmergencyVal ? '🚨 NEW EMERGENCY JOB REQUEST!' : 'New Service Job Request',
            `You have received a new booking for ${service.name} on ${scheduled_date} at ${scheduled_time}.`,
            isEmergencyVal ? 'EMERGENCY' : 'JOB_REQUEST',
            JSON.stringify({ booking_id: bookingRes.id, booking_number: bookingNumber })
          ]
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      booking: {
        id: bookingRes.id,
        booking_number: bookingNumber,
        status: 'PENDING_WORKER_ACCEPTANCE',
        total_amount: totalAmount
      }
    });
  } catch (error) {
    console.error('Booking Creation Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create booking.', error: error.message });
  }
});

// Update Booking Status Machine (Worker / Customer / Admin)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, notes, material_amount } = req.body;
    const bookingId = req.params.id;

    const booking = await get(`SELECT b.*, s.name as service_name FROM bookings b JOIN services s ON b.service_id = s.id WHERE b.id = ?`, [bookingId]);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const currentStatus = booking.status;
    const allowedTransitions = {
      'PENDING_WORKER_ACCEPTANCE': ['CONFIRMED', 'REJECTED', 'CANCELLED'],
      'CONFIRMED': ['WORKER_ON_THE_WAY', 'CANCELLED', 'DISPUTED'],
      'WORKER_ON_THE_WAY': ['IN_PROGRESS', 'CANCELLED', 'DISPUTED'],
      'IN_PROGRESS': ['COMPLETED', 'DISPUTED'],
      'COMPLETED': ['DISPUTED'],
      'REJECTED': [],
      'CANCELLED': [],
      'DISPUTED': ['CONFIRMED', 'CANCELLED', 'COMPLETED']
    };

    if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${status}'.`
      });
    }

    let updatedMaterial = booking.material_amount || 0;
    if (material_amount !== undefined) {
      updatedMaterial = parseFloat(material_amount) || 0;
    }
    const updatedTotal = booking.base_amount + updatedMaterial;

    await run(
      `UPDATE bookings SET status = ?, material_amount = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, updatedMaterial, updatedTotal, bookingId]
    );

    // Record status history log
    await run(
      `INSERT INTO booking_status_history (booking_id, status, notes, changed_by_user_id) VALUES (?, ?, ?, ?)`,
      [bookingId, status, notes || `Status changed to ${status}`, req.user.id]
    );

    // If completed, update worker statistics
    if (status === 'COMPLETED' && booking.worker_id) {
      await run(
        `UPDATE workers SET total_completed_jobs = total_completed_jobs + 1 WHERE id = ?`,
        [booking.worker_id]
      );
    }

    // Send notifications to counterpart
    const customerUser = await get(`SELECT user_id FROM customers WHERE id = ?`, [booking.customer_id]);
    if (customerUser) {
      await run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [
          customerUser.user_id,
          `Booking Update: ${status.replace(/_/g, ' ')}`,
          `Your booking #${booking.booking_number} for ${booking.service_name} status is now ${status.replace(/_/g, ' ')}.`,
          'BOOKING_UPDATE'
        ]
      );
    }

    return res.json({
      success: true,
      message: `Booking status updated to ${status}.`,
      booking: {
        id: bookingId,
        status,
        total_amount: updatedTotal
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update booking status.', error: error.message });
  }
});

// List Bookings (Filtered by role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, emergency_only } = req.query;
    let sql = `
      SELECT b.*, 
             s.name as service_name, s.icon_name as service_icon,
             c_user.full_name as customer_name, c_user.phone as customer_phone,
             w_user.full_name as worker_name, w_user.phone as worker_phone, w.average_rating as worker_rating,
             cs.name as society_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN customers c ON b.customer_id = c.id
      JOIN users c_user ON c.user_id = c_user.id
      LEFT JOIN workers w ON b.worker_id = w.id
      LEFT JOIN users w_user ON w.user_id = w_user.id
      JOIN cooperative_societies cs ON b.society_id = cs.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'customer') {
      const customer = await get(`SELECT id FROM customers WHERE user_id = ?`, [req.user.id]);
      if (customer) {
        sql += ` AND b.customer_id = ?`;
        params.push(customer.id);
      }
    } else if (req.user.role === 'worker') {
      const worker = await get(`SELECT id FROM workers WHERE user_id = ?`, [req.user.id]);
      if (worker) {
        sql += ` AND b.worker_id = ?`;
        params.push(worker.id);
      }
    } else if (req.user.role === 'coop_admin') {
      const coop = await get(`SELECT id FROM cooperative_societies WHERE contact_email = ?`, [req.user.email]);
      if (coop) {
        sql += ` AND b.society_id = ?`;
        params.push(coop.id);
      }
    }

    if (status) {
      sql += ` AND b.status = ?`;
      params.push(status);
    }

    if (emergency_only === 'true') {
      sql += ` AND b.is_emergency = 1`;
    }

    sql += ` ORDER BY b.created_at DESC`;
    const bookings = await query(sql, params);

    return res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings.', error: error.message });
  }
});

// Single Booking details & history
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await get(
      `SELECT b.*, 
              s.name as service_name, s.description as service_desc,
              c_user.full_name as customer_name, c_user.phone as customer_phone, c_user.email as customer_email,
              w_user.full_name as worker_name, w_user.phone as worker_phone, w.profile_photo_url, w.average_rating as worker_rating,
              cs.name as society_name, cs.phone as society_phone
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN customers c ON b.customer_id = c.id
       JOIN users c_user ON c.user_id = c_user.id
       LEFT JOIN workers w ON b.worker_id = w.id
       LEFT JOIN users w_user ON w.user_id = w_user.id
       JOIN cooperative_societies cs ON b.society_id = cs.id
       WHERE b.id = ?`,
      [req.params.id]
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const history = await query(`SELECT * FROM booking_status_history WHERE booking_id = ? ORDER BY created_at ASC`, [booking.id]);
    const rating = await get(`SELECT * FROM ratings WHERE booking_id = ?`, [booking.id]);
    const invoice = await get(`SELECT * FROM invoices WHERE booking_id = ?`, [booking.id]);
    const payment = await get(`SELECT * FROM payments WHERE booking_id = ?`, [booking.id]);

    return res.json({
      success: true,
      booking: {
        ...booking,
        history,
        rating: rating || null,
        invoice: invoice || null,
        payment: payment || null
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch booking details.', error: error.message });
  }
});

export default router;
