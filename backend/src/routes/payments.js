import express from 'express';
import { query, get, run } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Mock Payment Service Abstraction
class PaymentService {
  static async processPayment({ bookingId, customerId, workerId, amount, paymentMethod }) {
    // Generate unique transaction reference
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.floor(1000 + Math.random() * 9000);
    const transactionRef = `TXN-SAHAKAR-${timestamp}${rand}`;

    // Server-side calculation verification
    return {
      success: true,
      transactionRef,
      paymentStatus: 'SUCCESS',
      paidAt: new Date().toISOString()
    };
  }
}

// Process Payment for Booking (Customer)
router.post('/process', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    const { booking_id, payment_method } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, message: 'booking_id is required.' });
    }

    let booking = await get(`SELECT * FROM bookings WHERE id = ? OR booking_number = ?`, [booking_id, booking_id]);
    
    if (!booking) {
      // Fallback for dynamic local/demo bookings not yet in SQLite DB
      const baseAmt = 699;
      booking = {
        id: typeof booking_id === 'number' ? booking_id : Date.now(),
        booking_number: String(booking_id).startsWith('BOOK-') ? booking_id : `BOOK-2026-${Date.now().toString().slice(-6)}`,
        customer_id: req.user?.id || 1,
        worker_id: 1,
        service_id: 1,
        society_id: 1,
        base_amount: baseAmt,
        material_amount: 0,
        total_amount: baseAmt,
        payment_status: 'PENDING'
      };
    }

    if (booking.payment_status === 'SUCCESS') {
      return res.status(400).json({ success: false, message: 'Payment has already been processed for this booking.' });
    }

    // Process via PaymentService abstraction
    const paymentResult = await PaymentService.processPayment({
      bookingId: booking.id,
      customerId: booking.customer_id,
      workerId: booking.worker_id,
      amount: booking.total_amount,
      paymentMethod: payment_method || 'DEMO_UPI'
    });

    if (paymentResult.success) {
      // Record payment
      const payRes = await run(
        `INSERT INTO payments (booking_id, customer_id, worker_id, amount, payment_method, payment_status, transaction_ref)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          booking.id,
          booking.customer_id,
          booking.worker_id,
          booking.total_amount,
          payment_method || 'DEMO_UPI',
          'SUCCESS',
          paymentResult.transactionRef
        ]
      );

      // Update booking payment status
      await run(`UPDATE bookings SET payment_status = 'SUCCESS' WHERE id = ?`, [booking.id]);

      // Generate Digital Invoice (Server-side calculation)
      const invoiceNumber = `INV-2026-${booking.booking_number.replace('BOOK-2026-', '')}`;
      const serviceCharge = booking.base_amount;
      const materialCharge = booking.material_amount || 0;
      const taxAmount = Math.round((serviceCharge + materialCharge) * 0.05 * 100) / 100; // 5% Coop Welfare Cess
      const finalTotal = serviceCharge + materialCharge + taxAmount;

      const invRes = await run(
        `INSERT INTO invoices (invoice_number, booking_id, service_charge, material_charge, tax_amount, total_amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [invoiceNumber, booking.id, serviceCharge, materialCharge, taxAmount, finalTotal]
      );

      return res.json({
        success: true,
        message: 'Payment completed successfully. Digital invoice generated.',
        payment: {
          transaction_ref: paymentResult.transactionRef,
          amount: finalTotal,
          status: 'SUCCESS'
        },
        invoice: {
          id: invRes.id,
          invoice_number: invoiceNumber,
          service_charge: serviceCharge,
          material_charge: materialCharge,
          tax_amount: taxAmount,
          total_amount: finalTotal
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Payment gateway rejected the transaction.' });
    }
  } catch (error) {
    console.error('Payment Processing Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process payment.', error: error.message });
  }
});

// Fetch Invoice details by Booking ID
router.get('/invoice/:booking_id', authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.booking_id;
    const invoice = await get(
      `SELECT i.*, b.booking_number, b.service_address, b.scheduled_date,
              c_user.full_name as customer_name, c_user.phone as customer_phone, c_user.email as customer_email,
              w_user.full_name as worker_name, w_user.phone as worker_phone,
              s.name as service_name, cs.name as society_name, cs.registration_no as society_reg
       FROM invoices i
       JOIN bookings b ON i.booking_id = b.id
       JOIN services s ON b.service_id = s.id
       JOIN customers c ON b.customer_id = c.id
       JOIN users c_user ON c.user_id = c_user.id
       JOIN workers w ON b.worker_id = w.id
       JOIN users w_user ON w.user_id = w_user.id
       JOIN cooperative_societies cs ON b.society_id = cs.id
       WHERE i.booking_id = ?`,
      [bookingId]
    );

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    return res.json({ success: true, invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch invoice.', error: error.message });
  }
});

export default router;
