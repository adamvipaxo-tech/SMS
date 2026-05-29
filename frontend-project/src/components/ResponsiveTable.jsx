export default function ResponsiveTable({ headers, rows, emptyMessage = 'No data.', rowKey }) {
  if (!rows?.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-400 sm:py-10">{emptyMessage}</p>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              {headers.map((h) => (
                <th key={h} className="pb-3 pr-3 font-semibold last:pr-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={rowKey ? rowKey(row, i) : i} className="hover:bg-slate-50/80">
                {row.cells.map((cell, j) => (
                  <td key={j} className="py-3 pr-3 text-slate-700 last:pr-0">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row, i) => (
          <div
            key={rowKey ? rowKey(row, i) : i}
            className="rounded-lg border border-slate-100 bg-slate-50/60 p-4"
          >
            {row.cells.map((cell, j) => (
              <div
                key={j}
                className={`flex flex-col gap-0.5 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${
                  j > 0 ? 'border-t border-slate-200/80' : ''
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {headers[j]}
                </span>
                <span className="text-sm text-slate-800 sm:text-right">{cell}</span>
              </div>
            ))}
            {row.actions && <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">{row.actions}</div>}
          </div>
        ))}
      </div>
    </>
  );
}
