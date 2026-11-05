export interface PageResponse<T> {
  element: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}