const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const warehouseRoutes = require('./routes/warehouses');
const transactionRoutes = require('./routes/transactions');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'StockHub SMS API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

async function seedDefaultUser() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS c FROM User');
    if (rows[0].c === 0) {
      const hash = await bcrypt.hash('manager123', 10);
      await pool.query('INSERT INTO User (username, password) VALUES (?, ?)', ['manager', hash]);
      console.log('Default user created: manager / manager123');
    }
  } catch (err) {
    console.warn('Could not seed user (database may not be ready):', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`StockHub SMS API running on http://localhost:${PORT}`);
  await seedDefaultUser();
});
