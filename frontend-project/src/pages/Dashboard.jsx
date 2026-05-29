import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Alert from '../components/Alert';
import ResponsiveTable from '../components/ResponsiveTable';

export default function Dashboard() {
  const { username } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: dash } = await api.get('/dashboard');
      setData(dash);
    } catch {
      setError('Could not load dashboard. Check that the backend and database are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="page-container flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <Alert type="error" message={error} />
      </div>
    );
  }

  const s = data.summary;
  const threshold = data.lowStockThreshold ?? 10;
  const alertCount = (s.lowStockCount || 0) + (s.outOfStockCount || 0);

  const txRows = data.recentTransactions?.map((t) => ({
    cells: [
      <span className="font-mono text-xs text-slate-500">#{t.transactionId}</span>,
      String(t.transactionDate).slice(0, 10),
      t.productName,
      t.warehouseName,
      t.quantityMoved,
      t.transactionType === 'STOCK_IN' ? (
        <span className="badge-in">In</span>
      ) : (
        <span className="badge-out">Out</span>
      ),
    ],
  }));

  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${username}. Overview of StockHub Ltd inventory and activity.`}
      >
        <button type="button" onClick={load} className="btn-secondary w-full sm:w-auto">
          Refresh
        </button>
      </PageHeader>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {/* Alert banner */}
      {alertCount > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-amber-900">
                  {alertCount} stock alert{alertCount !== 1 ? 's' : ''} need attention
                </p>
                <p className="text-sm text-amber-800">
                  {s.outOfStockCount || 0} out of stock · {s.lowStockCount || 0} below {threshold} units
                </p>
              </div>
            </div>
            <Link to="/products" className="btn-primary shrink-0 text-center">
              View products
            </Link>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="Products"
          value={s.productCount}
          sub={`${s.warehouseCount} warehouses`}
          color="brand"
          to="/products"
        />
        <KpiCard
          label="Units in stock"
          value={Number(s.totalUnits).toLocaleString()}
          sub="Total quantity"
          color="slate"
        />
        <KpiCard
          label="Inventory value"
          value={`${Number(s.totalInventoryValue).toLocaleString()}`}
          sub="RWF"
          color="emerald"
        />
        <KpiCard
          label="Transactions"
          value={s.transactionCount}
          sub={`${s.todayTransactionCount || 0} today`}
          color="blue"
          to="/transactions"
        />
      </div>

      {/* Today movement + categories */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h2 className="mb-4 font-display text-base font-semibold text-slate-900 sm:text-lg">
            Today&apos;s movement
          </h2>
          <div className="space-y-4">
            <MovementBar
              label="Stock in"
              value={s.todayStockIn}
              maxValue={Math.max(s.todayStockIn, s.todayStockOut, 1)}
              color="bg-emerald-500"
            />
            <MovementBar
              label="Stock out"
              value={s.todayStockOut}
              maxValue={Math.max(s.todayStockIn, s.todayStockOut, 1)}
              color="bg-amber-500"
            />
          </div>
          <Link to="/transactions" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
            Manage transactions →
          </Link>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-4 font-display text-base font-semibold text-slate-900 sm:text-lg">
            Stock by category
          </h2>
          {!data.categoryBreakdown?.length ? (
            <p className="text-sm text-slate-400">No categories yet.</p>
          ) : (
            <div className="space-y-3">
              {data.categoryBreakdown.map((c) => {
                const max = Math.max(...data.categoryBreakdown.map((x) => Number(x.totalUnits)), 1);
                const pct = Math.round((Number(c.totalUnits) / max) * 100);
                return (
                  <div key={c.category}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{c.category}</span>
                      <span className="text-slate-500">
                        {c.totalUnits} units · {c.productCount} products
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Low stock + out of stock */}
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AlertPanel
          title="Low stock alerts"
          subtitle={`Products with fewer than ${threshold} units`}
          items={data.lowStockAlerts}
          type="low"
          emptyText="No low stock items. All products are adequately stocked."
        />
        <AlertPanel
          title="Out of stock"
          subtitle="Products with zero quantity — reorder needed"
          items={data.outOfStock}
          type="out"
          emptyText="No out-of-stock products."
        />
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 sm:text-lg">
              Recent transactions
            </h2>
            <p className="text-sm text-slate-500">Latest stock in and stock out activity</p>
          </div>
          <Link to="/transactions" className="btn-secondary text-center text-sm">
            View all
          </Link>
        </div>
        <ResponsiveTable
          headers={['ID', 'Date', 'Product', 'Warehouse', 'Qty', 'Type']}
          rows={txRows}
          emptyMessage="No transactions recorded yet."
        />
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink to="/products" label="Add product" />
        <QuickLink to="/warehouse" label="Add warehouse" />
        <QuickLink to="/transactions" label="New transaction" />
        <QuickLink to="/reports" label="View reports" />
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color, to }) {
  const colors = {
    brand: 'border-brand-200 bg-brand-50/50',
    slate: 'border-slate-200 bg-slate-50/50',
    emerald: 'border-emerald-200 bg-emerald-50/50',
    blue: 'border-blue-200 bg-blue-50/50',
  };
  const inner = (
    <div className={`card !p-4 transition hover:shadow-md sm:!p-5 ${colors[color]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">{label}</p>
      <p className="mt-1 break-words font-display text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function MovementBar({ label, value, maxValue, color }) {
  const v = Number(value) || 0;
  const max = Math.max(Number(maxValue) || 1, 1);
  const width = Math.min(100, (v / max) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">{v}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function AlertPanel({ title, subtitle, items, type, emptyText }) {
  return (
    <div className={`card border-l-4 ${type === 'out' ? 'border-l-red-500' : 'border-l-amber-500'}`}>
      <h2 className="font-display text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
      <p className="mb-4 text-sm text-slate-500">{subtitle}</p>
      {!items?.length ? (
        <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto sm:max-h-80">
          {items.map((p) => (
            <li
              key={p.productCode}
              className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{p.productName}</p>
                <p className="font-mono text-xs text-slate-500">
                  {p.productCode} · {p.category}
                </p>
              </div>
              <span
                className={`shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-bold sm:self-center ${
                  type === 'out'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {p.quantityInStock} left
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuickLink({ to, label }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 sm:text-sm"
    >
      {label}
    </Link>
  );
}
