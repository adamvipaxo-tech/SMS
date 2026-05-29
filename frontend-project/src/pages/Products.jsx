import { useEffect, useState } from 'react';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';
import Alert from '../components/Alert';
import ResponsiveTable from '../components/ResponsiveTable';

const emptyForm = {
  productCode: '',
  productName: '',
  category: '',
  quantityInStock: '',
  unitPrice: '',
  supplierName: '',
  dateReceived: '',
};

const fields = [
  ['productCode', 'Product code', 'text', 'P001'],
  ['productName', 'Product name', 'text', 'Rice 25kg'],
  ['category', 'Category', 'text', 'Grains'],
  ['quantityInStock', 'Quantity in stock', 'number', '0'],
  ['unitPrice', 'Unit price (RWF)', 'number', '15000'],
  ['supplierName', 'Supplier name', 'text', 'Supplier Ltd'],
  ['dateReceived', 'Date received', 'date', ''],
];

export default function Products() {
  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch {
      setMessage({ type: 'error', text: 'Could not load products.' });
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post('/products', form);
      setMessage({ type: 'success', text: 'Product recorded successfully.' });
      setForm(emptyForm);
      loadProducts();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add product.' });
    } finally {
      setLoading(false);
    }
  };

  const tableRows = products.map((p) => ({
    cells: [
      <span className="font-mono text-xs text-brand-700">{p.productCode}</span>,
      <span className="font-medium">{p.productName}</span>,
      p.category,
      <span className={p.quantityInStock < 10 ? 'font-semibold text-amber-600' : 'font-semibold'}>
        {p.quantityInStock}
      </span>,
      `${Number(p.unitPrice).toLocaleString()} RWF`,
    ],
  }));

  return (
    <div className="page-container">
      <PageHeader title="Products" description="Record product details and view current inventory." />

      <div className="split-layout">
        <form onSubmit={handleSubmit} className="card lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">Add product</h2>
          <div className="mb-4">
            <Alert type={message.type} message={message.text} />
          </div>
          <div className="form-grid">
            {fields.map(([name, label, type, placeholder]) => (
              <div key={name} className={name === 'supplierName' || name === 'dateReceived' ? 'sm:col-span-2 lg:col-span-1' : ''}>
                <label className="field-label">{label}</label>
                <input
                  name={name}
                  type={type}
                  step={type === 'number' ? '0.01' : undefined}
                  className="input-field"
                  value={form[name]}
                  onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                  placeholder={placeholder}
                  required={name !== 'quantityInStock'}
                />
              </div>
            ))}
          </div>
          <button type="submit" className="btn-primary mt-5 w-full sm:w-auto" disabled={loading}>
            {loading ? 'Saving…' : 'Insert product'}
          </button>
        </form>

        <div className="card lg:col-span-3">
          <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">Product list</h2>
          <ResponsiveTable
            headers={['Code', 'Name', 'Category', 'Stock', 'Price']}
            rows={tableRows}
            emptyMessage="No products yet. Add your first product."
            rowKey={(_, i) => products[i]?.productCode}
          />
        </div>
      </div>
    </div>
  );
}
