import {IAuthRepository} from '../repositories/IAuthRepository';

export class LogoutUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepo.logout();
  }
}
