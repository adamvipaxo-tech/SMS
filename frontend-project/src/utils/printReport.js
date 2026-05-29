function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value) {
  if (value == null || value === '') return '—';
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return s;
  return d.toISOString().slice(0, 10);
}

function formatNum(value) {
  const n = Number(value);
  return Number.isNaN(n) ? '0' : n.toLocaleString('en-US');
}

function stockValue(row) {
  const v = Number(row.stockValue);
  if (!Number.isNaN(v)) return v;
  return Number(row.quantityInStock || 0) * Number(row.unitPrice || 0);
}

function tableHtml(title, subtitle, headers, rows, emptyText) {
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows?.length
    ? rows
        .map(
          (row) =>
            `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`
        )
        .join('')
    : `<tr><td colspan="${headers.length}" class="empty">${escapeHtml(emptyText)}</td></tr>`;

  return `
    <section class="section">
      <h2>${escapeHtml(title)}</h2>
      <p class="subtitle">${escapeHtml(subtitle)}</p>
      <table>
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </section>`;
}

function buildReportHtml({ report, period, generatedBy }) {
  const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
  const inv = report.inventorySummary || {};
  const now = new Date().toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const availableRows =
    report.availableStock?.map((r) => [
      r.productCode,
      r.productName,
      r.category,
      r.quantityInStock,
      `${formatNum(r.unitPrice)} RWF`,
      `${formatNum(stockValue(r))} RWF`,
    ]) || [];

  const stockInRows =
    report.stockIn?.map((r) => [
      formatDate(r.transactionDate),
      r.productName,
      r.warehouseName,
      r.quantityMoved,
    ]) || [];

  const stockOutRows =
    report.stockOut?.map((r) => [
      formatDate(r.transactionDate),
      r.productName,
      r.warehouseName,
      r.quantityMoved,
    ]) || [];

  const rangeStart = formatDate(report.dateRange?.start);
  const rangeEnd = formatDate(report.dateRange?.end);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>StockHub SMS — ${escapeHtml(periodLabel)} Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 15mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      padding: 20px 24px;
      font-size: 11pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .letterhead { border-bottom: 3px solid #047857; padding-bottom: 16px; margin-bottom: 24px; }
    .letterhead h1 { font-size: 20pt; color: #047857; }
    .letterhead .meta { margin-top: 10px; font-size: 10pt; color: #444; }
    .letterhead .meta p { margin: 3px 0; }
    .summary {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .summary-card { border: 1px solid #ccc; padding: 12px 14px; border-radius: 4px; }
    .summary-card label {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #666;
      display: block;
    }
    .summary-card .value { font-size: 14pt; font-weight: bold; margin-top: 4px; }
    .section { margin-bottom: 28px; page-break-inside: avoid; }
    .section h2 {
      font-size: 13pt;
      color: #047857;
      border-bottom: 1px solid #ddd;
      padding-bottom: 6px;
      margin-bottom: 4px;
    }
    .section .subtitle { font-size: 9pt; color: #666; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    th, td { border: 1px solid #bbb; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f0fdf4; font-weight: 600; font-size: 8.5pt; text-transform: uppercase; }
    tr:nth-child(even) td { background: #fafafa; }
    td.empty { text-align: center; color: #888; font-style: italic; }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>StockHub Ltd — Stock Management Report</h1>
    <div class="meta">
      <p><strong>Company:</strong> StockHub Ltd, Kigali City, Rwanda</p>
      <p><strong>Report type:</strong> ${escapeHtml(periodLabel)} inventory report</p>
      <p><strong>Period:</strong> ${escapeHtml(rangeStart)} to ${escapeHtml(rangeEnd)}</p>
      <p><strong>Generated:</strong> ${escapeHtml(now)}</p>
      <p><strong>Prepared by:</strong> ${escapeHtml(generatedBy || 'Store Manager')}</p>
    </div>
  </div>

  <div class="summary">
    <div class="summary-card"><label>Total products</label><div class="value">${inv.productCount ?? 0}</div></div>
    <div class="summary-card"><label>Total units in stock</label><div class="value">${inv.totalUnits ?? 0}</div></div>
    <div class="summary-card"><label>Inventory value (RWF)</label><div class="value">${formatNum(inv.totalInventoryValue)}</div></div>
    <div class="summary-card"><label>${escapeHtml(periodLabel)} stock in / out</label><div class="value">In: ${report.movementSummary?.totalStockIn ?? 0} · Out: ${report.movementSummary?.totalStockOut ?? 0}</div></div>
  </div>

  ${tableHtml(
    '1. Available Stock',
    'Current inventory levels across all products',
    ['Code', 'Product', 'Category', 'Qty', 'Unit Price', 'Stock Value'],
    availableRows,
    'No products in inventory.'
  )}

  ${tableHtml(
    '2. Stock In',
    `${periodLabel} incoming stock movements`,
    ['Date', 'Product', 'Warehouse', 'Quantity'],
    stockInRows,
    'No stock-in transactions in this period.'
  )}

  ${tableHtml(
    '3. Stock Out',
    `${periodLabel} outgoing stock movements`,
    ['Date', 'Product', 'Warehouse', 'Quantity'],
    stockOutRows,
    'No stock-out transactions in this period.'
  )}

  <div class="footer">
    Stock Management System (SMS) — National Practical Exam 2026 · Confidential internal report
  </div>
</body>
</html>`;
}

/**
 * Wait until iframe/window document is ready, then print.
 * Fixes race where onload fires before handler is attached after document.write.
 */
function runWhenDocumentReady(contentWindow, callback) {
  const doc = contentWindow.document;
  let done = false;

  const run = () => {
    if (done) return;
    done = true;
    setTimeout(callback, 400);
  };

  if (doc.readyState === 'complete' || doc.readyState === 'interactive') {
    run();
    return;
  }

  contentWindow.addEventListener('load', run, { once: true });
  setTimeout(run, 1500);
}

function printViaIframe(html) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'StockHub report print');
    iframe.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;';

    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    if (!win) {
      iframe.remove();
      reject(new Error('Print frame unavailable'));
      return;
    }

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 500);
    };

    try {
      const doc = win.document;
      doc.open();
      doc.write(html);
      doc.close();
    } catch (err) {
      iframe.remove();
      reject(err);
      return;
    }

    runWhenDocumentReady(win, () => {
      try {
        win.focus();
        win.print();
        win.addEventListener(
          'afterprint',
          () => {
            cleanup();
            resolve();
          },
          { once: true }
        );
        setTimeout(() => {
          cleanup();
          resolve();
        }, 120000);
      } catch (err) {
        cleanup();
        reject(err);
      }
    });
  });
}

function printViaPopup(html) {
  return new Promise((resolve, reject) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      reject(new Error('Pop-up blocked. Allow pop-ups for this site to print.'));
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    runWhenDocumentReady(printWindow, () => {
      try {
        printWindow.focus();
        printWindow.print();
        printWindow.addEventListener('afterprint', () => {
          printWindow.close();
          resolve();
        }, { once: true });
        setTimeout(resolve, 60000);
      } catch (err) {
        printWindow.close();
        reject(err);
      }
    });
  });
}

/**
 * Print a full stock report document (not the app screen).
 * @returns {Promise<void>}
 */
export async function printStockReport({ report, period, generatedBy }) {
  if (!report) {
    throw new Error('No report data to print. Wait for the report to load.');
  }

  const html = buildReportHtml({ report, period, generatedBy });

  try {
    await printViaIframe(html);
  } catch {
    await printViaPopup(html);
  }
}
