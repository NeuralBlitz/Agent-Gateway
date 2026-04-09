/** Enterprise Pagination Helper — cursor-based and offset-based pagination */
export interface PageResult<T> { data: T[]; pageInfo: PageInfo; }
export interface PageInfo { hasNextPage: boolean; hasPrevPage: boolean; startCursor?: string; endCursor?: string; total?: number; page: number; pageSize: number; }
export interface PaginationParams { page?: number; pageSize?: number; cursor?: string; limit?: number; }

export class Paginator {
  static offset<T>(data: T[], params: PaginationParams): PageResult<T> {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = data.slice(start, end);
    const hasMore = end < data.length;

    return {
      data: slice,
      pageInfo: { hasNextPage: hasMore, hasPrevPage: page > 1, startCursor: String(start), endCursor: String(Math.min(end - 1, data.length - 1)), total: data.length, page, pageSize },
    };
  }

  static cursor<T>(data: T[], params: PaginationParams, cursorField: string = 'id'): PageResult<T> {
    const limit = Math.min(params.limit || 20, 100);
    let filtered = data;

    if (params.cursor) {
      const cursorIdx = data.findIndex((item: any) => String((item as any)[cursorField]) === params.cursor);
      if (cursorIdx >= 0) filtered = data.slice(cursorIdx + 1);
    }

    const slice = filtered.slice(0, limit);
    const hasMore = filtered.length > limit;
    const firstItem = slice[0] as any;
    const lastItem = slice[slice.length - 1] as any;

    return {
      data: slice,
      pageInfo: {
        hasNextPage: hasMore,
        hasPrevPage: !!params.cursor,
        startCursor: firstItem ? String(firstItem[cursorField]) : undefined,
        endCursor: lastItem ? String(lastItem[cursorField]) : undefined,
        page: 1,
        pageSize: limit,
      },
    };
  }
}
