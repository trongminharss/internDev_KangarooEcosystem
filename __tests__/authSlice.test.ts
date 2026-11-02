jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

import authReducer, {
  setUser,
  clearUser,
  setToken,
  updateStepVerify,
  AuthState,
} from '@/features/auth/presentation/redux/authSlice';

describe('authSlice reducer', () => {
  const initialState: AuthState = {
    user: {
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
    },
    token: null,
    status: 'idle',
    otpStatus: 'idle',
    error: null,
  };

  it('should return initial state when passed empty action', () => {
    expect(authReducer(undefined, {type: 'UNKNOWN'})).toEqual(initialState);
  });

  it('should handle setUser correctly', () => {
    const mockUser = {
      ...initialState.user!,
      fullName: 'Tran Van C',
      stepVerify: 2,
    };
    const nextState = authReducer(
      initialState,
      setUser({userInfo: mockUser, token: 'jwt-token-123', isFromLogin: true}),
    );

    expect(nextState.user?.fullName).toBe('Tran Van C');
    expect(nextState.token).toBe('jwt-token-123');
    expect(nextState.status).toBe('succeeded');
    expect(nextState.user?.loginStepVerify).toBe(2);
  });

  it('should handle clearUser correctly', () => {
    const loggedInState: AuthState = {
      user: {
        ...initialState.user!,
        fullName: 'Logged User',
      },
      token: 'token',
      status: 'succeeded',
      otpStatus: 'idle',
      error: null,
    };

    const nextState = authReducer(loggedInState, clearUser());
    expect(nextState.token).toBeNull();
    expect(nextState.status).toBe('idle');
    expect(nextState.user?.fullName).toBe('');
  });

  it('should handle setToken and updateStepVerify', () => {
    let state = authReducer(initialState, setToken('new-token'));
    expect(state.token).toBe('new-token');

    state = authReducer(state, updateStepVerify(8));
    expect(state.user?.stepVerify).toBe(8);
  });

  it('should handle requestOtp lifecycle', () => {
    let state = authReducer(initialState, {type: 'auth/requestOtp/pending'});
    expect(state.otpStatus).toBe('loading');

    state = authReducer(state, {type: 'auth/requestOtp/fulfilled'});
    expect(state.otpStatus).toBe('succeeded');

    state = authReducer(state, {type: 'auth/requestOtp/rejected'});
    expect(state.otpStatus).toBe('failed');
  });

  it('should handle verifyOtp fulfilled and rejected', () => {
    const mockUser = {
      ...initialState.user!,
      fullName: 'Otp User',
      phoneNumber: '0912345678',
    };
    const payload = {token: 'otp-token', user: mockUser};

    let errorState = authReducer(initialState, {
      type: 'auth/verifyOtp/rejected',
      payload: 'lỗi cũ',
    });
    expect(errorState.error).toBe('lỗi cũ');

    let state = authReducer(errorState, {type: 'auth/verifyOtp/pending'});
    expect(state.error).toBeNull();

    state = authReducer(state, {
      type: 'auth/verifyOtp/fulfilled',
      payload,
    });
    expect(state.status).toBe('succeeded');
    expect(state.token).toBe('otp-token');
    expect(state.user?.fullName).toBe('Otp User');

    state = authReducer(state, {
      type: 'auth/verifyOtp/rejected',
      payload: 'Mã OTP không đúng hoặc đã hết hạn',
    });
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Mã OTP không đúng hoặc đã hết hạn');
  });
});
