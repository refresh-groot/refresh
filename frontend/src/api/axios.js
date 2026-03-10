import axios from 'axios';
import { SERVER_URL } from '../app/constants';

const api = axios.create({
  baseURL: 'http://localhost:8080',   
  
  withCredentials: true, // 세션 쿠키

  
  timeout: 30000, // 30초
});

export default api;