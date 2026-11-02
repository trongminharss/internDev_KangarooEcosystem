let authToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export const setClientAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const setOnUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

export const notifyUnauthorized = () => {
  if (onUnauthorizedCallback) {
    onUnauthorizedCallback();
  }
};
