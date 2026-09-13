import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get, run, query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sahakargig_sih26089_super_secret_jwt_key_2026';

// Register User (Customer or Worker)
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, role, society_id, address, latitude, longitude, skills } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, full name, and role are required.' });
    }

    if (!['customer', 'worker'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be customer or worker for public registration.' });
    }

    const existingUser = await get(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userRes = await run(
      `INSERT INTO users (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)`,
      [email.toLowerCase().trim(), password_hash, role, full_name, phone || '']
    );

    const userId = userRes.id;

    if (role === 'customer') {
      await run(
        `INSERT INTO customers (user_id, default_address, latitude, longitude) VALUES (?, ?, ?, ?)`,
        [userId, address || 'Hyderabad, Telangana', latitude || 17.3850, longitude || 78.4867]
      );
    } else if (role === 'worker') {
      const selectedSocietyId = society_id || 1; // Default to Society 1 if unspecified
      const workerRes = await run(
        `INSERT INTO workers (user_id, society_id, address, latitude, longitude, verification_status) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, selectedSocietyId, address || 'Hyderabad, Telangana', latitude || 17.3850, longitude || 78.4867, 'PENDING']
      );

      // Attach selected skills if provided
      if (Array.isArray(skills)) {
        for (const skillId of skills) {
          await run(`INSERT OR IGNORE INTO worker_skills (worker_id, skill_id) VALUES (?, ?)`, [workerRes.id, skillId]);
        }
      }
    }

    const token = jwt.sign({ id: userId, email, role, full_name }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: { id: userId, email, role, full_name, phone }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.', error: error.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Fetch role specific details
    let profileData = {};
    if (user.role === 'customer') {
      profileData = await get(`SELECT * FROM customers WHERE user_id = ?`, [user.id]);
    } else if (user.role === 'worker') {
      profileData = await get(
        `SELECT w.*, cs.name as society_name, cs.city as society_city 
         FROM workers w 
         JOIN cooperative_societies cs ON w.society_id = cs.id 
         WHERE w.user_id = ?`,
        [user.id]
      );
    } else if (user.role === 'coop_admin') {
      // Find associated coop
      const coop = await get(`SELECT * FROM cooperative_societies WHERE contact_email = ?`, [user.email]);
      profileData = coop || { id: 1, name: 'Hyderabad Central Skilled Artisans Cooperative' };
    } else if (user.role === 'federation_admin') {
      const fed = await get(`SELECT * FROM federations LIMIT 1`);
      profileData = fed || { id: 1, name: 'Telangana State Labour Federation' };
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        language_preference: user.language_preference,
        profile: profileData
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
  }
});

// Current User Info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await get(`SELECT id, email, full_name, phone, role, language_preference, created_at FROM users WHERE id = ?`, [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let profileData = {};
    if (user.role === 'customer') {
      profileData = await get(`SELECT * FROM customers WHERE user_id = ?`, [user.id]);
    } else if (user.role === 'worker') {
      profileData = await get(
        `SELECT w.*, cs.name as society_name, cs.city as society_city 
         FROM workers w 
         JOIN cooperative_societies cs ON w.society_id = cs.id 
         WHERE w.user_id = ?`,
        [user.id]
      );
    } else if (user.role === 'coop_admin') {
      const coop = await get(`SELECT * FROM cooperative_societies WHERE contact_email = ?`, [user.email]);
      profileData = coop || { id: 1, name: 'Hyderabad Central Skilled Artisans Cooperative' };
    } else if (user.role === 'federation_admin') {
      const fed = await get(`SELECT * FROM federations LIMIT 1`);
      profileData = fed || { id: 1, name: 'Telangana State Labour Federation' };
    }

    return res.json({
      success: true,
      user: {
        ...user,
        profile: profileData
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error fetching user session.', error: error.message });
  }
});

export default router;
