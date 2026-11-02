import {User, AuthSession} from '../../domain/entities/User';

export interface UserDTO {
  fullName: string;
  phoneNumber?: string;
  isValid?: boolean;
  idNo?: string;
  birthDay?: string;
  gender?: number;
  nationality?: string;
  placeOfOrigin?: string;
  placeOfResidence?: string;
  personalIdentification?: string;
  placeIssue?: string;
  dateIssue?: string;
  imageIdentityCardBack?: string;
  imageIdentityCardFront?: string;
  stepVerify?: number;
  loginStepVerify?: number;
  originStepVerify?: number;
  isCreateDigitalSignature?: boolean;
  identityDateExpire?: string;
  email?: string;
}

export interface LoginResponseDTO {
  code?: number;
  message?: string;
  data?: {
    token: string;
    user: UserDTO;
  };
  token?: string;
  user?: UserDTO;
}

export const mapUserDTOToEntity = (dto: UserDTO): User => {
  return {
    fullName: dto.fullName || '',
    phoneNumber: dto.phoneNumber || '',
    isValid: Boolean(dto.isValid),
    idNo: dto.idNo || '',
    birthDay: dto.birthDay || '',
    gender: dto.gender ?? 1,
    nationality: dto.nationality || '',
    placeOfOrigin: dto.placeOfOrigin || '',
    placeOfResidence: dto.placeOfResidence || '',
    personalIdentification: dto.personalIdentification || '',
    placeIssue: dto.placeIssue || '',
    dateIssue: dto.dateIssue || '',
    imageIdentityCardBack: dto.imageIdentityCardBack || '',
    imageIdentityCardFront: dto.imageIdentityCardFront || '',
    stepVerify: dto.stepVerify ?? 1,
    loginStepVerify: dto.loginStepVerify ?? dto.stepVerify ?? 1,
    originStepVerify: dto.originStepVerify ?? dto.stepVerify ?? 1,
    isCreateDigitalSignature: Boolean(dto.isCreateDigitalSignature),
    identityDateExpire: dto.identityDateExpire || '',
    email: dto.email || '',
  };
};

export const mapLoginResponseDTOToSession = (dto: LoginResponseDTO): AuthSession => {
  const token = dto.data?.token || dto.token || '';
  const userDTO = dto.data?.user || dto.user || ({} as UserDTO);
  return {
    token,
    user: mapUserDTOToEntity(userDTO),
  };
};

export interface OtpResponseDTO {
  code?: number;
  message?: string;
}
