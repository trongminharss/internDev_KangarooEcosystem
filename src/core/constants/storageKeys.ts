export const STORAGE_KEYS = {
  KEY_FIRST_LOAD: 'isFirstTimeLoadApp',
  KEY_TERMS_ACCEPTED: 'termsAccepted',
  LOGIN_WITH_BIOMETRIC: 'isLoginWithBiometric',
  USERNAME: 'USERNAME',
  PASSWORD: 'PASSWORD',
  AUTH_TOKEN: 'AUTH_TOKEN',
  USER_INFO: 'USER_INFO',
  IDCARD_INFO: (phone: string) => `idcard_info_${phone}`,
  KEY_THEME_MODE: 'theme_mode',
  KEY_LANGUAGE: 'language',
  KEY_SAVED_WIFI_SSID: 'saved_wifi_ssid',
} as const;
