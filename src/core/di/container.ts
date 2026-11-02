import {AuthRemoteDataSource} from '@/features/auth/data/datasources/AuthRemoteDataSource';
import {AuthLocalDataSource} from '@/features/auth/data/datasources/AuthLocalDataSource';
import {AuthRepositoryImpl} from '@/features/auth/data/repositories/AuthRepositoryImpl';
import {LogoutUseCase} from '@/features/auth/domain/usecases/LogoutUseCase';
import {RequestOtpUseCase} from '@/features/auth/domain/usecases/RequestOtpUseCase';
import {VerifyOtpUseCase} from '@/features/auth/domain/usecases/VerifyOtpUseCase';
import {DeviceBleDataSource} from '@/features/device/data/datasources/DeviceBleDataSource';
import {DeviceLocalDataSource} from '@/features/device/data/datasources/DeviceLocalDataSource';
import {DeviceRepositoryImpl} from '@/features/device/data/repositories/DeviceRepositoryImpl';
import {ScanDevicesUseCase} from '@/features/device/domain/usecases/ScanDevicesUseCase';
import {ScanWifiUseCase} from '@/features/device/domain/usecases/ScanWifiUseCase';
import {ProvisionDeviceUseCase} from '@/features/device/domain/usecases/ProvisionDeviceUseCase';

// Data Sources
const authRemoteDataSource = new AuthRemoteDataSource();
const authLocalDataSource = new AuthLocalDataSource();
const deviceBleDataSource = new DeviceBleDataSource();
const deviceLocalDataSource = new DeviceLocalDataSource();

// Repositories
export const authRepository = new AuthRepositoryImpl(authRemoteDataSource, authLocalDataSource);
const deviceRepository = new DeviceRepositoryImpl(
  deviceBleDataSource,
  deviceLocalDataSource,
);

// Use Cases
export const container = {
  logoutUseCase: new LogoutUseCase(authRepository),
  requestOtpUseCase: new RequestOtpUseCase(authRepository),
  verifyOtpUseCase: new VerifyOtpUseCase(authRepository),
  scanDevicesUseCase: new ScanDevicesUseCase(deviceRepository),
  scanWifiUseCase: new ScanWifiUseCase(deviceRepository),
  provisionDeviceUseCase: new ProvisionDeviceUseCase(deviceRepository),
};

export default container;
