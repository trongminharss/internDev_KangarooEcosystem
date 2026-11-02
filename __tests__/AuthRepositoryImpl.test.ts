import {AuthRepositoryImpl} from '@/features/auth/data/repositories/AuthRepositoryImpl';
import {AuthRemoteDataSource} from '@/features/auth/data/datasources/AuthRemoteDataSource';
import {AuthLocalDataSource} from '@/features/auth/data/datasources/AuthLocalDataSource';
import {ApiError} from '@/core/api/apiError';

jest.mock('@/core/api/axiosClient', () => ({
  setClientAuthToken: jest.fn(),
  axiosClient: {post: jest.fn()},
}));
jest.mock('@/core/utils/storage', () => ({
  Storage: {getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()},
}));

describe('AuthRepositoryImpl.verifyOtp error split', () => {
  const repo = new AuthRepositoryImpl(
    new AuthRemoteDataSource(),
    new AuthLocalDataSource(),
  );

  it('rethrows ApiError with statusCode instead of demo fallback', async () => {
    jest
      .spyOn(repo['remote'], 'verifyOtp')
      .mockRejectedValue(new ApiError('Mã OTP không đúng', 400, -1));
    await expect(repo.verifyOtp('0912345678', '000000')).rejects.toThrow(
      'Mã OTP không đúng',
    );
  });

  it('falls back to demo session on plain network error', async () => {
    jest
      .spyOn(repo['remote'], 'verifyOtp')
      .mockRejectedValue(new Error('Network Error'));
    const session = await repo.verifyOtp('0912345678', '000000');
    expect(session.token).toContain('demo-token-');
  });
});
