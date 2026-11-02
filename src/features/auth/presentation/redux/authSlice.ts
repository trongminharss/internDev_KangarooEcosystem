import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {User} from '../../domain/entities/User';
import {requestOtp, verifyOtp, logoutUser} from './authThunks';

export interface AuthState {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  otpStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialUserState: User = {
  fullName: '',
  phoneNumber: '',
  isValid: false,
  idNo: '',
  birthDay: '',
  gender: 1,
  nationality: '',
  placeOfOrigin: '',
  placeOfResidence: '',
  personalIdentification: '',
  placeIssue: '',
  dateIssue: '',
  imageIdentityCardBack: '',
  imageIdentityCardFront: '',
  stepVerify: 1,
  originStepVerify: 1,
  loginStepVerify: 1,
  isCreateDigitalSignature: false,
  identityDateExpire: '',
  email: '',
};

const initialState: AuthState = {
  user: initialUserState,
  token: null,
  status: 'idle',
  otpStatus: 'idle',
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{userInfo: User; token: string; isFromLogin?: boolean}>,
    ) => {
      const userInfo = {...action.payload.userInfo};
      if (action.payload.isFromLogin) {
        userInfo.loginStepVerify = userInfo.stepVerify;
        userInfo.originStepVerify = userInfo.stepVerify;
      }
      state.user = userInfo;
      state.token = action.payload.token;
      state.status = 'succeeded';
      state.error = null;
    },
    clearUser: state => {
      state.user = initialUserState;
      state.token = null;
      state.status = 'idle';
      state.otpStatus = 'idle';
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    updateStepVerify: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.stepVerify = action.payload;
      }
    },
    updatePhoneNumber: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.phoneNumber = action.payload;
      }
    },
    updateUserInfo: (
      state,
      action: PayloadAction<{
        phoneNumber: string;
        isValid: boolean;
        stepVerify: number;
        fullName: string;
        email: string;
      }>,
    ) => {
      if (state.user) {
        state.user.phoneNumber = action.payload.phoneNumber;
        state.user.isValid = action.payload.isValid;
        state.user.stepVerify = action.payload.stepVerify;
        state.user.fullName = action.payload.fullName;
        state.user.email = action.payload.email;
      }
    },
    updateLoginStepVerify: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.loginStepVerify = action.payload;
      }
    },
    updateFrontImage: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.imageIdentityCardFront = action.payload;
      }
    },
    updateBackImage: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.imageIdentityCardBack = action.payload;
      }
    },
    updateCreatedSignature: state => {
      if (state.user) {
        state.user.isCreateDigitalSignature = true;
      }
    },
  },
  extraReducers: builder => {
    // Request OTP
    builder
      .addCase(requestOtp.pending, state => {
        state.otpStatus = 'loading';
      })
      .addCase(requestOtp.fulfilled, state => {
        state.otpStatus = 'succeeded';
      })
      .addCase(requestOtp.rejected, state => {
        state.otpStatus = 'failed';
      });

    // Verify OTP (login / auto register)
    builder
      .addCase(verifyOtp.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Xác thực OTP thất bại';
      });

    // Logout
    builder
      .addCase(logoutUser.pending, state => {
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, state => {
        state.status = 'idle';
        state.otpStatus = 'idle';
        state.user = initialUserState;
        state.token = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload || null;
      });
  },
});

export const {
  setUser,
  clearUser,
  setToken,
  updateStepVerify,
  updatePhoneNumber,
  updateUserInfo,
  updateLoginStepVerify,
  updateFrontImage,
  updateBackImage,
  updateCreatedSignature,
} = authSlice.actions;

export default authSlice.reducer;
