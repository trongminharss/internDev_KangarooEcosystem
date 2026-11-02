export interface User {
  fullName: string;
  phoneNumber?: string;
  isValid?: boolean;
  idNo: string;
  birthDay: string;
  gender: number;
  nationality: string;
  placeOfOrigin: string;
  placeOfResidence: string;
  personalIdentification: string;
  placeIssue: string;
  dateIssue: string;
  imageIdentityCardBack?: string;
  imageIdentityCardFront?: string;
  stepVerify?: number;
  loginStepVerify?: number;
  originStepVerify?: number;
  isCreateDigitalSignature?: boolean;
  identityDateExpire?: string;
  email: string;
}

export interface AuthSession {
  token: string;
  user: User;
}
