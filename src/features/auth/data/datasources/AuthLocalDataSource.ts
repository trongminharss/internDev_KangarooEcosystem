import {Storage} from '@/core/utils/storage';
import {AuthSession} from '../../domain/entities/User';

export class AuthLocalDataSource {
  async getStoredAuth(): Promise<AuthSession | null> {
    const token = await Storage.getItem<string>(Storage.AUTH_TOKEN);
    const user = await Storage.getItem<any>(Storage.USER_INFO);
    if (token && user) {
      return {token, user};
    }
    return null;
  }

  async saveAuth(session: AuthSession): Promise<void> {
    await Storage.setItem(Storage.AUTH_TOKEN, session.token);
    await Storage.setItem(Storage.USER_INFO, session.user);
  }

  async clearAuth(): Promise<void> {
    await Storage.removeItem(Storage.AUTH_TOKEN);
    await Storage.removeItem(Storage.USER_INFO);
  }

  async setIsFirstLoad(value: boolean): Promise<void> {
    await Storage.setItem(Storage.KEY_FIRST_LOAD, value);
  }
}
