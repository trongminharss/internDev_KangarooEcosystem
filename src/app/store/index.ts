import {configureStore} from '@reduxjs/toolkit';
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import rootReducer, {RootState} from './rootReducer';
import {setOnUnauthorizedCallback} from '@/core/api/authToken';
import {clearUser} from '@/features/auth/presentation/redux/authSlice';

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Setup 401 unauthorized handler
setOnUnauthorizedCallback(() => {
  store.dispatch(clearUser());
});

export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export * from './rootReducer';
export default store;
