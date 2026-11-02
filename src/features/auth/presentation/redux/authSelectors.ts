import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@/app/store';

export const selectAuthState = (state: RootState) => state.auth;

export const selectCurrentUser = createSelector(
  [selectAuthState],
  auth => auth.user,
);

export const selectAuthToken = createSelector(
  [selectAuthState],
  auth => auth.token,
);

export const selectAuthStatus = createSelector(
  [selectAuthState],
  auth => auth.status,
);

export const selectOtpStatus = createSelector(
  [selectAuthState],
  auth => auth.otpStatus,
);

export const selectAuthError = createSelector(
  [selectAuthState],
  auth => auth.error,
);

export const selectIsAuthenticated = createSelector(
  [selectAuthToken],
  token => Boolean(token && token.length > 0),
);

export const selectIsAuthLoading = createSelector(
  [selectAuthStatus, selectOtpStatus],
  (status, otpStatus) => status === 'loading' || otpStatus === 'loading',
);
