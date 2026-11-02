import {axiosClient} from '@/core/api/axiosClient';
import {ENDPOINTS} from '@/core/api/endpoints';
import {LoginResponseDTO, OtpResponseDTO} from '../models/AuthDTO';

export class AuthRemoteDataSource {
  async requestOtp(phoneNumber: string): Promise<OtpResponseDTO> {
    const response = await axiosClient.post<OtpResponseDTO>(ENDPOINTS.AUTH.REQUEST_OTP, {
      phoneNumber,
    });
    return response.data;
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<LoginResponseDTO> {
    const response = await axiosClient.post<LoginResponseDTO>(ENDPOINTS.AUTH.VERIFY_OTP, {
      phoneNumber,
      otp,
    });
    return response.data;
  }
}
