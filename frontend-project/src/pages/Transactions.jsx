import { useEffect, useState } from 'react';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';
import Alert from '../components/Alert';
import ResponsiveTable from '../components/ResponsiveTable';

const emptyForm = {
  transactionDate: new Date().toISOString().slice(0, 10),
  quantityMoved: '',
  transactionType: 'STOCK_IN',
  productCode: '',
  warehouseCode: '',
};

export default function Transactions() {
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    try {
      const [tx, pr, wh] = await Promise.all([
        api.get('/transactions'),
        api.get('/products'),
        api.get('/warehouses'),
      ]);
      setTransactions(tx.data);
      setProducts(pr.data);
      setWarehouses(wh.data);
    } catch {
      setMessage({ type: 'error', text: 'Could not load data.' });
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      transactionDate: new Date().toISOString().slice(0, 10),
    });
    setEditId(null);
  };

  const handleEdit = (t) => {
    setEditId(t.transactionId);
    setForm({
      transactionDate: String(t.transactionDate).slice(0, 10),
      quantityMoved: String(t.quantityMoved),
      transactionType: t.transactionType,
      productCode: t.productCode,
      warehouseCode: t.warehouseCode,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? Stock levels will be adjusted.')) return;
    try {
      await api.delete(`/transactions/${id}`);
      setMessage({ type: 'success', text: 'Transaction deleted.' });
      loadAll();
      if (editId === id) resetForm();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      if (editId) {
        await api.put(`/transactions/${editId}`, form);
        setMessage({ type: 'success', text: 'Transaction updated.' });
      } else {
        await api.post('/transactions', form);
        setMessage({ type: 'success', text: 'Transaction recorded.' });
      }
      resetForm();
      loadAll();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Operation failed.' });
    } finally {
      setLoading(false);
    }
  };

  const tableRows = transactions.map((t) => {
    const actionBtns = (
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={() => handleEdit(t)}>
          Edit
        </button>
        <button type="button" className="btn-danger" onClick={() => handleDelete(t.transactionId)}>
          Delete
        </button>
      </div>
    );

    return {
      cells: [
        <span className="font-mono text-xs text-slate-500">#{t.transactionId}</span>,
        String(t.transactionDate).slice(0, 10),
        <span>
          <span className="block font-medium">{t.productName}</span>
          <span className="font-mono text-xs text-slate-400">{t.productCode}</span>
        </span>,
        t.warehouseName,
        <span className="font-semibold">{t.quantityMoved}</span>,
        t.transactionType === 'STOCK_IN' ? (
          <span className="badge-in">Stock In</span>
        ) : (
          <span className="badge-out">Stock Out</span>
        ),
        <span className="hidden md:inline">{actionBtns}</span>,
      ],
      actions: actionBtns,
    };
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Transactions"
        description="Record stock in/out. Update, delete, and retrieve transactions here."
      />

      <form onSubmit={handleSubmit} className="card mb-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            {editId ? 'Update transaction' : 'New stock transaction'}
          </h2>
          {editId && (
            <button type="button" className="btn-secondary w-full text-xs sm:w-auto" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
        <div className="mb-4">
          <Alert type={message.type} message={message.text} />
        </div>
        <div className="form-grid">
          <div>
            <label className="field-label">Transaction date</label>
            <input
              type="date"
              className="input-field"
              value={form.transactionDate}
              onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="field-label">Quantity moved</label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={form.quantityMoved}
              onChange={(e) => setForm({ ...form, quantityMoved: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="field-label">Transaction type</label>
            <select
              className="input-field"
              value={form.transactionType}
              onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
            >
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="field-label">Product</label>
            <select
              className="input-field"
              value={form.productCode}
              onChange={(e) => setForm({ ...form, productCode: e.target.value })}
              required
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.productCode} value={p.productCode}>
                  {p.productCode} — {p.productName} (stock: {p.quantityInStock})
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="field-label">Warehouse</label>
            <select
              className="input-field"
              value={form.warehouseCode}
              onChange={(e) => setForm({ ...form, warehouseCode: e.target.value })}
              required
            >
              <option value="">Select warehouse</option>
              {warehouses.map((w) => (
                <option key={w.warehouseCode} value={w.warehouseCode}>
                  {w.warehouseCode} — {w.warehouseName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary mt-5 w-full sm:w-auto" disabled={loading}>
          {loading ? 'Saving…' : editId ? 'Update transaction' : 'Insert transaction'}
        </button>
      </form>

      <div className="card">
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">Transaction history</h2>
        <ResponsiveTable
          headers={['ID', 'Date', 'Product', 'Warehouse', 'Qty', 'Type', 'Actions']}
          rows={tableRows}
          emptyMessage="No transactions recorded yet."
          rowKey={(_, i) => transactions[i]?.transactionId}
        />
      </div>
    </div>
  );
}
