export function getPagination(query: Record<string, unknown>) {
  const requestedPage = Number(query.page);
  const requestedSize = Number(query.pageSize);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10_000) : 1;
  const pageSize =
    Number.isInteger(requestedSize) && requestedSize > 0 ? Math.min(requestedSize, 100) : 20;
  return { page, pageSize, offset: (page - 1) * pageSize };
}
