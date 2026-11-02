import {VerifyOtpUseCase} from '@/features/auth/domain/usecases/VerifyOtpUseCase';
import {IAuthRepository} from '@/features/auth/domain/repositories/IAuthRepository';
import {AuthSession} from '@/features/auth/domain/entities/User';

describe('VerifyOtpUseCase', () => {
  let mockAuthRepo: jest.Mocked<IAuthRepository>;
  let useCase: VerifyOtpUseCase;

  const mockSession: AuthSession = {
    token: 'test-token',
    user: {
      fullName: 'Nguyen Van A',
      phoneNumber: '0912345678',
      idNo: '123456789',
      birthDay: '01/01/1995',
      gender: 1,
      nationality: 'VN',
      placeOfOrigin: 'HN',
      placeOfResidence: 'HN',
      personalIdentification: 'None',
      placeIssue: 'CA',
      dateIssue: '01/01/2020',
      email: 'a@example.com',
    },
  };

  beforeEach(() => {
    mockAuthRepo = {
      requestOtp: jest.fn().mockResolvedValue(undefined),
      verifyOtp: jest.fn().mockResolvedValue(mockSession),
      logout: jest.fn().mockResolvedValue(undefined),
      getStoredAuth: jest.fn().mockResolvedValue(null),
      saveAuth: jest.fn().mockResolvedValue(undefined),
      setIsFirstLoad: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new VerifyOtpUseCase(mockAuthRepo);
  });

  it('should throw if otp is not 6 digits', async () => {
    await expect(useCase.execute('0912345678', '12345')).rejects.toThrow(
      'Mã OTP phải gồm 6 chữ số',
    );
    expect(mockAuthRepo.verifyOtp).not.toHaveBeenCalled();
  });

  it('should verify, saveAuth and setIsFirstLoad(false) on success', async () => {
    const result = await useCase.execute('0912345678', '123456');

    expect(mockAuthRepo.verifyOtp).toHaveBeenCalledWith('0912345678', '123456');
    expect(mockAuthRepo.saveAuth).toHaveBeenCalledWith(mockSession);
    expect(mockAuthRepo.setIsFirstLoad).toHaveBeenCalledWith(false);
    expect(result).toEqual(mockSession);
  });

  it('should not saveAuth or setIsFirstLoad when repo verifyOtp rejects', async () => {
    mockAuthRepo.verifyOtp = jest
      .fn()
      .mockRejectedValue(new Error('Mã OTP không đúng hoặc đã hết hạn'));

    await expect(useCase.execute('0912345678', '123456')).rejects.toThrow(
      'Mã OTP không đúng hoặc đã hết hạn',
    );
    expect(mockAuthRepo.saveAuth).not.toHaveBeenCalled();
    expect(mockAuthRepo.setIsFirstLoad).not.toHaveBeenCalled();
  });
});
