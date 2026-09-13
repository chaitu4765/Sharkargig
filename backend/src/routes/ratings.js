import express from 'express';
import { get, run, query } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Submit Rating & Review (Customer)
router.post('/', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    const { booking_id, rating_score, review_text } = req.body;

    if (!booking_id || !rating_score) {
      return res.status(400).json({ success: false, message: 'booking_id and rating_score (1-5) are required.' });
    }

    const scoreNum = parseInt(rating_score);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating score must be an integer between 1 and 5.' });
    }

    const booking = await get(`SELECT * FROM bookings WHERE id = ?`, [booking_id]);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Verify service is COMPLETED
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Rating can only be submitted for completed services.' });
    }

    // Check for duplicate rating
    const existingRating = await get(`SELECT id FROM ratings WHERE booking_id = ?`, [booking_id]);
    if (existingRating) {
      return res.status(400).json({ success: false, message: 'You have already submitted a rating for this service.' });
    }

    // Save rating
    const ratingRes = await run(
      `INSERT INTO ratings (booking_id, customer_id, worker_id, rating_score, review_text) VALUES (?, ?, ?, ?, ?)`,
      [booking.id, booking.customer_id, booking.worker_id, scoreNum, review_text || '']
    );

    // Recalculate worker average rating from all actual completed ratings in database
    const avgData = await get(
      `SELECT AVG(rating_score) as avg_rating FROM ratings WHERE worker_id = ?`,
      [booking.worker_id]
    );

    if (avgData && avgData.avg_rating) {
      const newAvg = Math.round(avgData.avg_rating * 100) / 100;
      await run(`UPDATE workers SET average_rating = ? WHERE id = ?`, [newAvg, booking.worker_id]);
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you! Rating submitted successfully.',
      rating_id: ratingRes.id
    });
  } catch (error) {
    console.error('Rating Submission Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit rating.', error: error.message });
  }
});

export default router;
