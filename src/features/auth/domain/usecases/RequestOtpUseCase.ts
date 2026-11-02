import {IAuthRepository} from '../repositories/IAuthRepository';

export class RequestOtpUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(phoneNumber: string): Promise<void> {
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      throw new Error('Số điện thoại không được để trống');
    }
    await this.authRepo.requestOtp(phoneNumber);
  }
}
