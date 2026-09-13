import express from 'express';
import { query, get, run } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all service categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await query(`SELECT * FROM service_categories ORDER BY name ASC`);
    return res.json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.', error: error.message });
  }
});

// Get all services (with category details)
router.get('/', async (req, res) => {
  try {
    const { category_id, search, emergency } = req.query;
    let sql = `
      SELECT s.*, sc.name as category_name, sc.code as category_code, sc.icon_name as category_icon
      FROM services s
      JOIN service_categories sc ON s.category_id = sc.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      sql += ` AND s.category_id = ?`;
      params.push(category_id);
    }

    if (emergency === 'true') {
      sql += ` AND s.is_emergency_capable = 1`;
    }

    if (search) {
      sql += ` AND (s.name LIKE ? OR s.description LIKE ? OR sc.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY s.name ASC`;
    const services = await query(sql, params);

    return res.json({ success: true, services });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch services.', error: error.message });
  }
});

// Get single service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await get(
      `SELECT s.*, sc.name as category_name 
       FROM services s 
       JOIN service_categories sc ON s.category_id = sc.id 
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const skills = await query(`SELECT * FROM skills WHERE service_id = ?`, [service.id]);
    const certifications = await query(`SELECT * FROM certifications WHERE service_id = ?`, [service.id]);

    return res.json({ success: true, service: { ...service, skills, certifications } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch service details.', error: error.message });
  }
});

// Add new service (Admin capability)
router.post('/', authenticateToken, requireRole('coop_admin', 'federation_admin'), async (req, res) => {
  try {
    const { category_id, name, code, description, base_price, estimated_duration_mins, icon_name, is_emergency_capable } = req.body;

    if (!category_id || !name || !code || !base_price) {
      return res.status(400).json({ success: false, message: 'Category, Name, Code, and Base Price are required.' });
    }

    const resObj = await run(
      `INSERT INTO services (category_id, name, code, description, base_price, estimated_duration_mins, icon_name, is_emergency_capable)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [category_id, name, code.toUpperCase(), description || '', base_price, estimated_duration_mins || 60, icon_name || 'Tool', is_emergency_capable ? 1 : 0]
    );

    return res.status(201).json({ success: true, message: 'New service created successfully.', service_id: resObj.id });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add service.', error: error.message });
  }
});

export default router;
