import {createAsyncThunk} from '@reduxjs/toolkit';
import {container} from '@/core/di/container';
import {AuthSession} from '../../domain/entities/User';

export const requestOtp = createAsyncThunk<void, string, {rejectValue: string}>(
  'auth/requestOtp',
  async (phoneNumber, {rejectWithValue}) => {
    try {
      await container.requestOtpUseCase.execute(phoneNumber);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Không gửi được mã OTP');
    }
  },
);

export const verifyOtp = createAsyncThunk<
  AuthSession,
  {phoneNumber: string; otp: string},
  {rejectValue: string}
>('auth/verifyOtp', async ({phoneNumber, otp}, {rejectWithValue}) => {
  try {
    return await container.verifyOtpUseCase.execute(phoneNumber, otp);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Xác thực OTP thất bại');
  }
});

export const logoutUser = createAsyncThunk<void, void, {rejectValue: string}>(
  'auth/logoutUser',
  async (_, {rejectWithValue}) => {
    try {
      await container.logoutUseCase.execute();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Đăng xuất thất bại');
    }
  },
);
