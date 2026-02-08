export interface BaseApiResponse {
    code: number;
    status: string;
    message: string;
}

export interface ApiResponse<T = null> extends BaseApiResponse {
    data?: T;
}

export interface ApiErrorResponse extends BaseApiResponse {
    errors?: Record<string, string>;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedApiResponse<T> extends BaseApiResponse {
    data: T[];
    pagination: PaginationMeta;
}

export interface TokenExpires {
    token: string;
    expires: string;
}

export interface Tokens {
    access: TokenExpires;
    refresh: TokenExpires;
}
