export default function PageHeader({ title, description, children }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="page-title break-words">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500 sm:text-base">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}
