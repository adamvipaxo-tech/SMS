const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Warehouse ORDER BY warehouseName');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch warehouses' });
  }
});

router.post('/', async (req, res) => {
  const { warehouseCode, warehouseName, warehouseLocation } = req.body;
  if (!warehouseCode || !warehouseName || !warehouseLocation) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    await pool.query(
      'INSERT INTO Warehouse (warehouseCode, warehouseName, warehouseLocation) VALUES (?, ?, ?)',
      [warehouseCode, warehouseName, warehouseLocation]
    );
    res.status(201).json({ message: 'Warehouse added successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Warehouse code already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to add warehouse' });
  }
});

module.exports = router;
