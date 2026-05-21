const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const API_BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

export default API_BASE_URL;
