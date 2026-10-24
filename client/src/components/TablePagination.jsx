import "./TablePagination.css";

export default function TablePagination({
  page,
  pageSize = 10,
  totalItems,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  return (
    <nav className="table-pagination" aria-label="Table pages">
      <span>
        Showing {(page - 1) * pageSize + 1}-
        {Math.min(page * pageSize, totalItems)} of {totalItems}
      </span>
      <div>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
