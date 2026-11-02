export class ApiError extends Error {
  public statusCode?: number;
  public code?: number | string;
  public details?: any;

  constructor(message: string, statusCode?: number, code?: number | string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromAxiosError(error: any): ApiError {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message =
        data?.message ||
        data?.error ||
        (status === 408 ? 'Không kết nối được tới hệ thống' : `Lỗi hệ thống (${status})`);
      const code = data?.code ?? status;
      return new ApiError(message, status, code, data);
    }
    if (error.request) {
      return new ApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.', 0, 'NETWORK_ERROR');
    }
    return new ApiError(error.message || 'Đã có lỗi không xác định xảy ra', 500, 'UNKNOWN_ERROR');
  }
}
