import {useCallback} from 'react';
import {useAppDispatch, useAppSelector} from '@/app/store';
import {
  selectCurrentUser,
  selectAuthToken,
  selectAuthStatus,
  selectOtpStatus,
  selectAuthError,
  selectIsAuthenticated,
  selectIsAuthLoading,
} from '../redux/authSelectors';
import {
  requestOtp as requestOtpThunk,
  verifyOtp as verifyOtpThunk,
  logoutUser,
} from '../redux/authThunks';
import {setUser, clearUser} from '../redux/authSlice';
import {User} from '../../domain/entities/User';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectAuthToken);
  const status = useAppSelector(selectAuthStatus);
  const otpStatus = useAppSelector(selectOtpStatus);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsAuthLoading);

  const requestOtp = useCallback(
    async (phoneNumber: string) => {
      return dispatch(requestOtpThunk(phoneNumber)).unwrap();
    },
    [dispatch],
  );

  const verifyOtp = useCallback(
    async (payload: {phoneNumber: string; otp: string}) => {
      return dispatch(verifyOtpThunk(payload)).unwrap();
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    return dispatch(logoutUser()).unwrap();
  }, [dispatch]);

  const saveUserSession = useCallback(
    (userInfo: User, authToken: string, isFromLogin: boolean = true) => {
      dispatch(setUser({userInfo, token: authToken, isFromLogin}));
    },
    [dispatch],
  );

  const resetUser = useCallback(() => {
    dispatch(clearUser());
  }, [dispatch]);

  return {
    user,
    token,
    status,
    otpStatus,
    error,
    isAuthenticated,
    isLoading,
    requestOtp,
    verifyOtp,
    logout,
    saveUserSession,
    resetUser,
  };
};

export default useAuth;
