export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationParams {
  skip: number;
  take: number;
}

export class PaginationHelper {
  static readonly DEFAULT_PAGE = 1;
  static readonly DEFAULT_LIMIT = 10;
  static readonly MAX_LIMIT = 100;

  static validateAndNormalize(options: PaginationOptions): {
    page: number;
    limit: number;
  } {
    const page = Math.max(1, options.page || this.DEFAULT_PAGE);
    const limit = Math.min(
      Math.max(1, options.limit || this.DEFAULT_LIMIT),
      this.MAX_LIMIT,
    );

    return { page, limit };
  }

  static getPaginationParams(page: number, limit: number): PaginationParams {
    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }

  static buildPaginationResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginationResult<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  static async paginate<T>(
    countFn: () => Promise<number>,
    dataFn: (params: PaginationParams) => Promise<T[]>,
    options: PaginationOptions,
  ): Promise<PaginationResult<T>> {
    const { page, limit } = this.validateAndNormalize(options);
    const paginationParams = this.getPaginationParams(page, limit);

    const [total, data] = await Promise.all([
      countFn(),
      dataFn(paginationParams),
    ]);

    return this.buildPaginationResult(data, total, page, limit);
  }
}
