import {IAuthRepository} from '../repositories/IAuthRepository';
import {AuthSession} from '../entities/User';

export class VerifyOtpUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(phoneNumber: string, otp: string): Promise<AuthSession> {
    const code = otp ? otp.trim() : '';
    if (!/^\d{6}$/.test(code)) {
      throw new Error('Mã OTP phải gồm 6 chữ số');
    }
    const session = await this.authRepo.verifyOtp(phoneNumber, code);
    await this.authRepo.saveAuth(session);
    await this.authRepo.setIsFirstLoad(false);
    return session;
  }
}
