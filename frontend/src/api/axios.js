import axios from 'axios';
import { SERVER_URL } from '../app/constants';

const api = axios.create({
  baseURL: SERVER_URL, 
  withCredentials: true, // 세션 쿠키 필수
  timeout: 30000 // 30초
});

export default api;