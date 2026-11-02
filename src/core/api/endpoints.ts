export const ENDPOINTS = {
  AUTH: {
    REQUEST_OTP: 'customer/send-otp',
    VERIFY_OTP: 'customer/verify-otp',
    SETUP_CALL: (guid: string) => `customer/callvideo/${guid}`,
  },
} as const;
