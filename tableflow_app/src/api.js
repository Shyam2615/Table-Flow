import axios from 'axios';

// Change this to your computer's local IP when testing on a real phone
const BASE_URL = 'http://192.168.0.105:5000/api';

const API = axios.create({ baseURL: BASE_URL });

let _token = null;

export const setToken = (token) => { _token = token; };
export const getToken = () => _token;

API.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

export default API;
