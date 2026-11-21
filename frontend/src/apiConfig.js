const getApiBaseUrl = () => {
  // إذا كنت تستخدم Vite
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  // إذا كنت تستخدم Create React App
  if (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  }
  // الوضع المحلي الافتراضي على حاسوبك
  return 'http://127.0.0.1:8000';
};

export const API_BASE = getApiBaseUrl();