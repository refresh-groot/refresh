import axios from 'axios';
import { SERVER_URL } from '../app/constants';

const api = axios.create({
  baseURL: 'http://localhost:8080',   // http://223.xxx:8080
  withCredentials: true // 세션 쿠키 필수
});

export default api;