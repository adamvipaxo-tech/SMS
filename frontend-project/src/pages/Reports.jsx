import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Alert from '../components/Alert';
import ResponsiveTable from '../components/ResponsiveTable';
import { printStockReport } from '../utils/printReport';

const periods = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export default function Reports() {
  const { username } = useAuth();
  const [period, setPeriod] = useState('daily');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [printError, setPrintError] = useState('');
  const [printing, setPrinting] = useState(false);

  const loadReport = async (p) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/reports/${p}`);
      setReport(data);
    } catch {
      setError('Failed to generate report. Ensure the backend and database are running.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(period);
  }, [period]);

  const handlePrint = async () => {
    if (!report || loading) return;
    setPrintError('');
    setPrinting(true);
    try {
      await printStockReport({ report, period, generatedBy: username });
    } catch (err) {
      setPrintError(err.message || 'Could not open print dialog. Try allowing pop-ups.');
    } finally {
      setPrinting(false);
    }
  };

  const inv = report?.inventorySummary;
  const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);

  return (
    <div className="page-container no-print-root">
      <PageHeader
        title="Reports"
        description="Daily, weekly, and monthly stock availability, stock in, and stock out."
      >
        <button
          type="button"
          className="btn-primary w-full sm:w-auto"
          onClick={handlePrint}
          disabled={!report || loading || printing}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          {printing ? 'Preparing…' : 'Print full report'}
        </button>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-md rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                period === p.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {report?.dateRange && (
          <p className="text-sm text-slate-500">
            <span className="hidden sm:inline">Period: </span>
            <strong className="text-slate-700">{report.dateRange.start}</strong>
            <span className="mx-1">→</span>
            <strong className="text-slate-700">{report.dateRange.end}</strong>
          </p>
        )}
      </div>

      <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:text-sm">
        <strong>Print tip:</strong> “Print full report” opens a dedicated document with letterhead, summary, and all three tables — not a screenshot of this screen.
      </p>

      <div className="mb-4 space-y-2">
        <Alert type="error" message={error} />
        <Alert type="error" message={printError} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-24">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            <p className="text-sm text-slate-400">Generating report…</p>
          </div>
        </div>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <StatCard label="Products" value={inv?.productCount ?? 0} />
            <StatCard label="Total units" value={inv?.totalUnits ?? 0} />
            <StatCard
              label="Inventory value"
              value={`${Number(inv?.totalInventoryValue || 0).toLocaleString()} RWF`}
            />
            <StatCard
              label={`${periodLabel} movement`}
              value={`In: ${report.movementSummary?.totalStockIn ?? 0} / Out: ${report.movementSummary?.totalStockOut ?? 0}`}
              small
            />
          </div>

          <ReportSection
            title="Available stock"
            subtitle="Current inventory levels across all products"
            headers={['Code', 'Product', 'Category', 'Qty', 'Unit price', 'Value']}
            rows={report.availableStock?.map((r) => ({
              cells: [
                r.productCode,
                r.productName,
                r.category,
                r.quantityInStock,
                `${Number(r.unitPrice).toLocaleString()} RWF`,
                `${Number(r.stockValue).toLocaleString()} RWF`,
              ],
            }))}
            empty="No products in inventory."
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportSection
              title="Stock in"
              subtitle={`${periodLabel} incoming transactions`}
              headers={['Date', 'Product', 'Warehouse', 'Qty']}
              rows={report.stockIn?.map((r) => ({
                cells: [
                  String(r.transactionDate).slice(0, 10),
                  r.productName,
                  r.warehouseName,
                  r.quantityMoved,
                ],
              }))}
              empty="No stock-in transactions in this period."
            />
            <ReportSection
              title="Stock out"
              subtitle={`${periodLabel} outgoing transactions`}
              headers={['Date', 'Product', 'Warehouse', 'Qty']}
              rows={report.stockOut?.map((r) => ({
                cells: [
                  String(r.transactionDate).slice(0, 10),
                  r.productName,
                  r.warehouseName,
                  r.quantityMoved,
                ],
              }))}
              empty="No stock-out transactions in this period."
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, small }) {
  return (
    <div className="card !p-4 sm:!p-6">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">{label}</p>
      <p
        className={`mt-1 break-words font-display font-bold text-slate-900 ${small ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'}`}
      >
        {value}
      </p>
    </div>
  );
}

function ReportSection({ title, subtitle, headers, rows, empty }) {
  return (
    <div className="card overflow-hidden">
      <h2 className="font-display text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
      <p className="mb-4 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
      <ResponsiveTable headers={headers} rows={rows} emptyMessage={empty} />
    </div>
  );
}
