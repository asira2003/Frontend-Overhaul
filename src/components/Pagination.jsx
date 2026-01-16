"use client";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxToShow = 7;
  const start = Math.max(1, currentPage - 3);
  const end = Math.min(totalPages, start + maxToShow - 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="mt-4 flex items-center justify-between">
      <button
        className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <div className="flex items-center gap-1">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={
              "h-8 w-8 rounded-md text-sm " +
              (p === currentPage
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-300 hover:bg-neutral-900")
            }
          >
            {p}
          </button>
        ))}
      </div>
      <button
        className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
}
