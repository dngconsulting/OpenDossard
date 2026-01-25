export type UserType = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roles: string;
};

export type CreateUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roles: string;
  password: string;
};

export type UserPaginationParams = {
  offset?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};

export type PaginationMeta = {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};
