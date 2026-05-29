const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, p.productName, w.warehouseName
       FROM StockTransaction t
       JOIN Product p ON t.productCode = p.productCode
       JOIN Warehouse w ON t.warehouseCode = w.warehouseCode
       ORDER BY t.transactionDate DESC, t.transactionId DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

router.post('/', async (req, res) => {
  const { transactionDate, quantityMoved, transactionType, productCode, warehouseCode } =
    req.body;
  if (!transactionDate || !quantityMoved || !transactionType || !productCode || !warehouseCode) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const qty = Number(quantityMoved);
  if (qty <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than zero' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [products] = await conn.query('SELECT quantityInStock FROM Product WHERE productCode = ?', [
      productCode,
    ]);
    if (!products.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    const currentStock = products[0].quantityInStock;
    if (transactionType === 'STOCK_OUT' && currentStock < qty) {
      await conn.rollback();
      return res.status(400).json({ message: 'Insufficient stock for this transaction' });
    }

    const [result] = await conn.query(
      `INSERT INTO StockTransaction
        (transactionDate, quantityMoved, transactionType, productCode, warehouseCode)
       VALUES (?, ?, ?, ?, ?)`,
      [transactionDate, qty, transactionType, productCode, warehouseCode]
    );

    const delta = transactionType === 'STOCK_IN' ? qty : -qty;
    await conn.query('UPDATE Product SET quantityInStock = quantityInStock + ? WHERE productCode = ?', [
      delta,
      productCode,
    ]);

    await conn.commit();
    res.status(201).json({ message: 'Transaction recorded', transactionId: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Failed to record transaction' });
  } finally {
    conn.release();
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { transactionDate, quantityMoved, transactionType, productCode, warehouseCode } =
    req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT * FROM StockTransaction WHERE transactionId = ?', [
      id,
    ]);
    if (!existing.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Transaction not found' });
    }
    const old = existing[0];

    const oldDelta = old.transactionType === 'STOCK_IN' ? -old.quantityMoved : old.quantityMoved;
    await conn.query('UPDATE Product SET quantityInStock = quantityInStock + ? WHERE productCode = ?', [
      oldDelta,
      old.productCode,
    ]);

    const qty = Number(quantityMoved);
    const [products] = await conn.query('SELECT quantityInStock FROM Product WHERE productCode = ?', [
      productCode,
    ]);
    if (!products.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }
    if (transactionType === 'STOCK_OUT' && products[0].quantityInStock < qty) {
      const revert = old.transactionType === 'STOCK_IN' ? old.quantityMoved : -old.quantityMoved;
      await conn.query('UPDATE Product SET quantityInStock = quantityInStock + ? WHERE productCode = ?', [
        revert,
        old.productCode,
      ]);
      await conn.rollback();
      return res.status(400).json({ message: 'Insufficient stock for this transaction' });
    }

    await conn.query(
      `UPDATE StockTransaction SET
        transactionDate = ?, quantityMoved = ?, transactionType = ?,
        productCode = ?, warehouseCode = ?
       WHERE transactionId = ?`,
      [transactionDate, qty, transactionType, productCode, warehouseCode, id]
    );

    const newDelta = transactionType === 'STOCK_IN' ? qty : -qty;
    await conn.query('UPDATE Product SET quantityInStock = quantityInStock + ? WHERE productCode = ?', [
      newDelta,
      productCode,
    ]);

    await conn.commit();
    res.json({ message: 'Transaction updated' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Failed to update transaction' });
  } finally {
    conn.release();
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query('SELECT * FROM StockTransaction WHERE transactionId = ?', [
      id,
    ]);
    if (!existing.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Transaction not found' });
    }
    const old = existing[0];
    const revert = old.transactionType === 'STOCK_IN' ? -old.quantityMoved : old.quantityMoved;
    await conn.query('UPDATE Product SET quantityInStock = quantityInStock + ? WHERE productCode = ?', [
      revert,
      old.productCode,
    ]);
    await conn.query('DELETE FROM StockTransaction WHERE transactionId = ?', [id]);
    await conn.commit();
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Failed to delete transaction' });
  } finally {
    conn.release();
  }
});

module.exports = router;
