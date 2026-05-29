import { useEffect, useState } from 'react';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';
import Alert from '../components/Alert';

const emptyForm = { warehouseCode: '', warehouseName: '', warehouseLocation: '' };

export default function Warehouses() {
  const [form, setForm] = useState(emptyForm);
  const [warehouses, setWarehouses] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/warehouses');
      setWarehouses(data);
    } catch {
      setMessage({ type: 'error', text: 'Could not load warehouses.' });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post('/warehouses', form);
      setMessage({ type: 'success', text: 'Warehouse added successfully.' });
      setForm(emptyForm);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add warehouse.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Warehouse"
        description="Register warehouse locations for stock movement tracking."
      />

      <div className="stack-cards">
        <form onSubmit={handleSubmit} className="card">
          <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">Add warehouse</h2>
          <div className="mb-4 space-y-3">
            <Alert type={message.type} message={message.text} />
            <div>
              <label className="field-label">Warehouse code</label>
              <input
                className="input-field"
                value={form.warehouseCode}
                onChange={(e) => setForm({ ...form, warehouseCode: e.target.value })}
                placeholder="W001"
                required
              />
            </div>
            <div>
              <label className="field-label">Warehouse name</label>
              <input
                className="input-field"
                value={form.warehouseName}
                onChange={(e) => setForm({ ...form, warehouseName: e.target.value })}
                placeholder="Kigali Central Depot"
                required
              />
            </div>
            <div>
              <label className="field-label">Location</label>
              <input
                className="input-field"
                value={form.warehouseLocation}
                onChange={(e) => setForm({ ...form, warehouseLocation: e.target.value })}
                placeholder="Nyarugenge District, Kigali"
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
            {loading ? 'Saving…' : 'Insert warehouse'}
          </button>
        </form>

        <div className="card">
          <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">
            Registered warehouses ({warehouses.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {warehouses.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-slate-400">
                No warehouses registered yet.
              </p>
            ) : (
              warehouses.map((w) => (
                <div
                  key={w.warehouseCode}
                  className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4 sm:gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold text-brand-700">{w.warehouseCode}</p>
                    <p className="truncate font-medium text-slate-900">{w.warehouseName}</p>
                    <p className="text-sm text-slate-500 break-words">{w.warehouseLocation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
