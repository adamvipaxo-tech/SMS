const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Product ORDER BY productName');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

router.post('/', async (req, res) => {
  const {
    productCode,
    productName,
    category,
    quantityInStock,
    unitPrice,
    supplierName,
    dateReceived,
  } = req.body;
  if (!productCode || !productName || !category || !supplierName || !dateReceived) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    await pool.query(
      `INSERT INTO Product
        (productCode, productName, category, quantityInStock, unitPrice, supplierName, dateReceived)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        productCode,
        productName,
        category,
        Number(quantityInStock) || 0,
        Number(unitPrice) || 0,
        supplierName,
        dateReceived,
      ]
    );
    res.status(201).json({ message: 'Product added successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Product code already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to add product' });
  }
});

module.exports = router;
