const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

function dateRange(period) {
  const end = new Date();
  const start = new Date();
  if (period === 'daily') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'weekly') {
    start.setDate(end.getDate() - 7);
  } else if (period === 'monthly') {
    start.setMonth(end.getMonth() - 1);
  } else {
    return null;
  }
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

router.get('/:period', async (req, res) => {
  const period = req.params.period;
  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    return res.status(400).json({ message: 'Period must be daily, weekly, or monthly' });
  }
  const range = dateRange(period);
  if (!range) {
    return res.status(400).json({ message: 'Invalid period' });
  }

  try {
    const [availableStock] = await pool.query(
      `SELECT productCode, productName, category, quantityInStock, unitPrice,
              (quantityInStock * unitPrice) AS stockValue
       FROM Product
       ORDER BY productName`
    );

    const [stockIn] = await pool.query(
      `SELECT t.transactionId, t.transactionDate, t.quantityMoved, t.productCode,
              p.productName, w.warehouseName
       FROM StockTransaction t
       JOIN Product p ON t.productCode = p.productCode
       JOIN Warehouse w ON t.warehouseCode = w.warehouseCode
       WHERE t.transactionType = 'STOCK_IN'
         AND t.transactionDate BETWEEN ? AND ?
       ORDER BY t.transactionDate DESC`,
      [range.start, range.end]
    );

    const [stockOut] = await pool.query(
      `SELECT t.transactionId, t.transactionDate, t.quantityMoved, t.productCode,
              p.productName, w.warehouseName
       FROM StockTransaction t
       JOIN Product p ON t.productCode = p.productCode
       JOIN Warehouse w ON t.warehouseCode = w.warehouseCode
       WHERE t.transactionType = 'STOCK_OUT'
         AND t.transactionDate BETWEEN ? AND ?
       ORDER BY t.transactionDate DESC`,
      [range.start, range.end]
    );

    const [summary] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN transactionType = 'STOCK_IN' THEN quantityMoved END), 0) AS totalStockIn,
         COALESCE(SUM(CASE WHEN transactionType = 'STOCK_OUT' THEN quantityMoved END), 0) AS totalStockOut
       FROM StockTransaction
       WHERE transactionDate BETWEEN ? AND ?`,
      [range.start, range.end]
    );

    const [inventorySummary] = await pool.query(
      `SELECT COUNT(*) AS productCount,
              COALESCE(SUM(quantityInStock), 0) AS totalUnits,
              COALESCE(SUM(quantityInStock * unitPrice), 0) AS totalInventoryValue
       FROM Product`
    );

    res.json({
      period,
      dateRange: range,
      inventorySummary: inventorySummary[0],
      availableStock,
      stockIn,
      stockOut,
      movementSummary: summary[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

module.exports = router;
