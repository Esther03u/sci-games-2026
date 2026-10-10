// Client-side paging for admin tables (components/ui/Pagination). Pure — tests/pagination.test.js.

/** The rows of one page plus where it sits; `page` is clamped to 1…totalPages. */
export function paginate(list = [], page = 1, size = 20) {
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (current - 1) * size;
  return {
    rows: list.slice(start, start + size),
    page: current,
    totalPages,
    total,
    from: total ? start + 1 : 0,
    to: Math.min(start + size, total),
  };
}

/** Page buttons to show: first, last, current ±1, with '…' for the gaps. */
export function pageItems(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const keep = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => keep.add(p));
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => keep.add(p));
  const pages = [...keep].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out = [];
  pages.forEach((p, i) => {
    const gap = i > 0 ? p - pages[i - 1] : 1;
    if (gap === 2)
      out.push(p - 1); // a single hidden page: show it instead of '…'
    else if (gap > 2) out.push('…');
    out.push(p);
  });
  return out;
}
