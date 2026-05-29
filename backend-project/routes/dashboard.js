const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const LOW_STOCK_THRESHOLD = 10;

router.get('/', async (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [[productStats]] = await pool.query(
      `SELECT
         COUNT(*) AS productCount,
         COALESCE(SUM(quantityInStock), 0) AS totalUnits,
         COALESCE(SUM(quantityInStock * unitPrice), 0) AS totalInventoryValue,
         SUM(CASE WHEN quantityInStock = 0 THEN 1 ELSE 0 END) AS outOfStockCount,
         SUM(CASE WHEN quantityInStock > 0 AND quantityInStock < ? THEN 1 ELSE 0 END) AS lowStockCount
       FROM Product`,
      [LOW_STOCK_THRESHOLD]
    );

    const [[warehouseStats]] = await pool.query('SELECT COUNT(*) AS warehouseCount FROM Warehouse');

    const [[txStats]] = await pool.query('SELECT COUNT(*) AS transactionCount FROM StockTransaction');

    const [[userStats]] = await pool.query('SELECT COUNT(*) AS managerCount FROM User');

    const [[todayMovement]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN transactionType = 'STOCK_IN' THEN quantityMoved END), 0) AS todayStockIn,
         COALESCE(SUM(CASE WHEN transactionType = 'STOCK_OUT' THEN quantityMoved END), 0) AS todayStockOut,
         COUNT(*) AS todayTransactionCount
       FROM StockTransaction
       WHERE transactionDate = ?`,
      [today]
    );

    const [lowStockAlerts] = await pool.query(
      `SELECT productCode, productName, category, quantityInStock, unitPrice, supplierName
       FROM Product
       WHERE quantityInStock > 0 AND quantityInStock < ?
       ORDER BY quantityInStock ASC, productName
       LIMIT 20`,
      [LOW_STOCK_THRESHOLD]
    );

    const [outOfStock] = await pool.query(
      `SELECT productCode, productName, category, quantityInStock, unitPrice, supplierName
       FROM Product
       WHERE quantityInStock = 0
       ORDER BY productName
       LIMIT 20`
    );

    const [recentTransactions] = await pool.query(
      `SELECT t.transactionId, t.transactionDate, t.quantityMoved, t.transactionType,
              t.productCode, p.productName, w.warehouseName, w.warehouseCode
       FROM StockTransaction t
       JOIN Product p ON t.productCode = p.productCode
       JOIN Warehouse w ON t.warehouseCode = w.warehouseCode
       ORDER BY t.transactionDate DESC, t.transactionId DESC
       LIMIT 15`
    );

    const [categoryBreakdown] = await pool.query(
      `SELECT category, COUNT(*) AS productCount,
              COALESCE(SUM(quantityInStock), 0) AS totalUnits
       FROM Product
       GROUP BY category
       ORDER BY totalUnits DESC
       LIMIT 6`
    );

    res.json({
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      summary: {
        productCount: productStats.productCount,
        warehouseCount: warehouseStats.warehouseCount,
        totalUnits: productStats.totalUnits,
        totalInventoryValue: productStats.totalInventoryValue,
        transactionCount: txStats.transactionCount,
        managerCount: userStats.managerCount,
        lowStockCount: productStats.lowStockCount,
        outOfStockCount: productStats.outOfStockCount,
        todayStockIn: todayMovement.todayStockIn,
        todayStockOut: todayMovement.todayStockOut,
        todayTransactionCount: todayMovement.todayTransactionCount,
      },
      lowStockAlerts,
      outOfStock,
      recentTransactions,
      categoryBreakdown,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
});

module.exports = router;
