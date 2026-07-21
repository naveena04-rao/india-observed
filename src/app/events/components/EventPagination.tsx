import Link from "next/link";

function pageHref(params: URLSearchParams, page: number) {
  const nextParams = new URLSearchParams(params);
  if (page === 1) nextParams.delete("page");
  else nextParams.set("page", String(page));
  const query = nextParams.toString();
  return query ? `/events?${query}` : "/events";
}

export function EventPagination({
  currentPage,
  pageCount,
  params,
}: {
  currentPage: number;
  pageCount: number;
  params: URLSearchParams;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav className="event-pagination" aria-label="Events pagination">
      {currentPage > 1 ? (
        <Link href={pageHref(params, currentPage - 1)}>Previous</Link>
      ) : (
        <span>Previous</span>
      )}
      <ol>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
          <li key={page}>
            {page === currentPage ? (
              <span aria-current="page">{page}</span>
            ) : (
              <Link href={pageHref(params, page)} aria-label={`Page ${page}`}>
                {page}
              </Link>
            )}
          </li>
        ))}
      </ol>
      {currentPage < pageCount ? (
        <Link href={pageHref(params, currentPage + 1)}>Next</Link>
      ) : (
        <span>Next</span>
      )}
    </nav>
  );
}
