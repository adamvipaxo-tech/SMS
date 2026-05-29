const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/me', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT userId, username, createdAt FROM User WHERE userId = ?',
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT userId, username, createdAt FROM User ORDER BY username'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch managers' });
  }
});

router.post('/', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO User (username, password) VALUES (?, ?)', [
      username.trim(),
      hash,
    ]);
    res.status(201).json({
      message: 'Manager account created',
      user: { userId: result.insertId, username: username.trim() },
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to create manager' });
  }
});

router.put('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  try {
    const [rows] = await pool.query('SELECT password FROM User WHERE userId = ?', [
      req.user.userId,
    ]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE User SET password = ? WHERE userId = ?', [hash, req.user.userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

router.delete('/:id', async (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.userId) {
    return res.status(400).json({ message: 'You cannot delete your own account while logged in' });
  }
  try {
    const [result] = await pool.query('DELETE FROM User WHERE userId = ?', [targetId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Manager not found' });
    }
    res.json({ message: 'Manager account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete manager' });
  }
});

module.exports = router;
