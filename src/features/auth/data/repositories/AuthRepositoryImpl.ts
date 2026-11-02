import {IAuthRepository} from '../../domain/repositories/IAuthRepository';
import {AuthSession} from '../../domain/entities/User';
import {AuthRemoteDataSource} from '../datasources/AuthRemoteDataSource';
import {AuthLocalDataSource} from '../datasources/AuthLocalDataSource';
import {mapLoginResponseDTOToSession} from '../models/AuthDTO';
import {ApiError} from '@/core/api/apiError';
import {setClientAuthToken} from '@/core/api/authToken';

export class AuthRepositoryImpl implements IAuthRepository {
  constructor(
    private remote: AuthRemoteDataSource,
    private local: AuthLocalDataSource,
  ) {}

  private getMockUserData(phoneNumber: string): AuthSession {
    return {
      token: 'demo-token-' + Date.now(),
      user: {
        fullName: 'Người Dùng Demo',
        phoneNumber: phoneNumber || '0910000000',
        isValid: true,
        idNo: '001234567890',
        birthDay: '01/01/1990',
        gender: 1,
        nationality: 'Việt Nam',
        placeOfOrigin: 'Hà Nội',
        placeOfResidence: 'Hà Nội',
        personalIdentification: 'Nốt ruồi dưới mép phải',
        placeIssue: 'Cục Cảnh sát QLHC về TTXH',
        dateIssue: '01/01/2021',
        stepVerify: 32,
        loginStepVerify: 32,
        originStepVerify: 32,
        isCreateDigitalSignature: true,
        identityDateExpire: '01/01/2035',
        email: 'demo@fpt.com',
      },
    };
  }

  async requestOtp(phoneNumber: string): Promise<void> {
    try {
      await this.remote.requestOtp(phoneNumber);
    } catch (error: any) {
      console.warn(
        '[AuthRepositoryImpl] requestOtp failed, continue in demo mode:',
        error?.message,
      );
    }
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<AuthSession> {
    let dto;
    try {
      dto = await this.remote.verifyOtp(phoneNumber, otp);
    } catch (error: any) {
      if (error instanceof ApiError && error.statusCode) {
        throw error;
      }
      console.warn(
        '[AuthRepositoryImpl] verifyOtp network error, fallback to demo session:',
        error?.message,
      );
      const fallback = this.getMockUserData(phoneNumber);
      setClientAuthToken(fallback.token);
      return fallback;
    }
    if (dto && (dto.code === 200 || dto.token || dto.data?.token)) {
      const session = mapLoginResponseDTOToSession(dto);
      setClientAuthToken(session.token);
      return session;
    }
    throw new Error(dto?.message || 'Mã OTP không đúng hoặc đã hết hạn');
  }

  async logout(): Promise<void> {
    setClientAuthToken(null);
    await this.local.clearAuth();
  }

  async getStoredAuth(): Promise<AuthSession | null> {
    const session = await this.local.getStoredAuth();
    if (session?.token) {
      setClientAuthToken(session.token);
    }
    return session;
  }

  async saveAuth(session: AuthSession): Promise<void> {
    await this.local.saveAuth(session);
    setClientAuthToken(session.token);
  }

  async setIsFirstLoad(value: boolean): Promise<void> {
    await this.local.setIsFirstLoad(value);
  }
}
