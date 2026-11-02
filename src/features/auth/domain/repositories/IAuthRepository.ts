import {AuthSession} from '../entities/User';

export interface IAuthRepository {
  requestOtp(phoneNumber: string): Promise<void>;
  verifyOtp(phoneNumber: string, otp: string): Promise<AuthSession>;
  logout(): Promise<void>;
  getStoredAuth(): Promise<AuthSession | null>;
  saveAuth(session: AuthSession): Promise<void>;
  setIsFirstLoad(value: boolean): Promise<void>;
}
