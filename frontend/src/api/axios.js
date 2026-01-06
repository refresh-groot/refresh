// api.js
import axios from 'axios';
import { SERVER_URL } from '../app/constants';

const api = axios.create({
  // [수정] 하드코딩된 localhost 주소를 constants에서 가져온 변수로 교체
  baseURL: SERVER_URL, 
  withCredentials: true // 세션 쿠키 필수
});

export default api;