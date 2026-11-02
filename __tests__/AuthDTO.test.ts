import {
  mapUserDTOToEntity,
  mapLoginResponseDTOToSession,
  UserDTO,
  LoginResponseDTO,
  OtpResponseDTO,
} from '@/features/auth/data/models/AuthDTO';

describe('AuthDTO Mappers', () => {
  it('should map UserDTO to User entity correctly with default fallbacks', () => {
    const dto: UserDTO = {
      fullName: 'Test User',
      email: 'test@example.com',
    };

    const entity = mapUserDTOToEntity(dto);
    expect(entity.fullName).toBe('Test User');
    expect(entity.email).toBe('test@example.com');
    expect(entity.gender).toBe(1);
    expect(entity.stepVerify).toBe(1);
    expect(entity.isValid).toBe(false);
  });

  it('should map LoginResponseDTO to AuthSession correctly', () => {
    const responseDTO: LoginResponseDTO = {
      code: 200,
      data: {
        token: 'token-abc',
        user: {
          fullName: 'Nguyen Van B',
          email: 'b@example.com',
          phoneNumber: '0900000000',
        },
      },
    };

    const session = mapLoginResponseDTOToSession(responseDTO);
    expect(session.token).toBe('token-abc');
    expect(session.user.fullName).toBe('Nguyen Van B');
    expect(session.user.phoneNumber).toBe('0900000000');
  });
});

describe('OtpResponseDTO', () => {
  it('should carry code and message from the send-otp response', () => {
    const dto: OtpResponseDTO = {code: 200, message: 'sent'};
    expect(dto.code).toBe(200);
    expect(dto.message).toBe('sent');
  });

  it('should tolerate an empty response body', () => {
    const dto: OtpResponseDTO = {};
    expect(dto.code).toBeUndefined();
  });
});
