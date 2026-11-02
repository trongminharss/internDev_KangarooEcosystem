import {RequestOtpUseCase} from '@/features/auth/domain/usecases/RequestOtpUseCase';
import {IAuthRepository} from '@/features/auth/domain/repositories/IAuthRepository';

describe('RequestOtpUseCase', () => {
  let mockAuthRepo: jest.Mocked<IAuthRepository>;
  let useCase: RequestOtpUseCase;

  beforeEach(() => {
    mockAuthRepo = {
      requestOtp: jest.fn().mockResolvedValue(undefined),
      verifyOtp: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn().mockResolvedValue(undefined),
      getStoredAuth: jest.fn().mockResolvedValue(null),
      saveAuth: jest.fn().mockResolvedValue(undefined),
      setIsFirstLoad: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RequestOtpUseCase(mockAuthRepo);
  });

  it('should throw if phone number is empty', async () => {
    await expect(useCase.execute('')).rejects.toThrow(
      'Số điện thoại không được để trống',
    );
    expect(mockAuthRepo.requestOtp).not.toHaveBeenCalled();
  });

  it('should delegate to repo requestOtp', async () => {
    await useCase.execute('0912345678');
    expect(mockAuthRepo.requestOtp).toHaveBeenCalledWith('0912345678');
  });
});
