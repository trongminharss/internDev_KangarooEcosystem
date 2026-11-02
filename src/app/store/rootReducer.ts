import {combineReducers} from '@reduxjs/toolkit';
import authReducer from '@/features/auth/presentation/redux/authSlice';
import purifierReducer from '@/features/device/presentation/redux/purifierSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  purifier: purifierReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
