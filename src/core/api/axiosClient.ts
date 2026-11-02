import axios, {AxiosInstance, InternalAxiosRequestConfig} from 'axios';
import {env} from '../config/env';
import {ApiError} from './apiError';
import {getAuthToken, notifyUnauthorized} from './authToken';

export const axiosClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (__DEV__) {
      console.info(
        `\n\t<--------- [AXIOS REQUEST] ${config.method?.toUpperCase()} ---------->\n\t-URL: ${
          config.baseURL || ''
        }${config.url}\n\t-HEADER: ${JSON.stringify(
          config.headers,
        )}\n\t-BODY: ${JSON.stringify(config.data ?? {})}`,
      );
    }
    return config;
  },
  error => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  response => {
    if (__DEV__) {
      console.info(
        `\n\t<----- [AXIOS RESPONSE] ${response.config.method?.toUpperCase()} ----->\n\t-URL: ${
          response.config.url
        }\n\t-STATUS: ${response.status}\n\t-DATA: ${JSON.stringify(
          response.data,
        )}`,
      );
    }
    return response;
  },
  async error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      notifyUnauthorized();
    }
    const apiError = ApiError.fromAxiosError(error);
    return Promise.reject(apiError);
  },
);

export default axiosClient;
