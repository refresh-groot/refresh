import axios from 'axios';
import { SERVER_URL } from '../app/constants';

// 개발 환경(npm run dev)일 때는 기존 SERVER_URL을 쓰고,
// 배포 환경(Vercel)일 때는 백엔드 서버 IP(http://223.130.157.123:8080)를 직접 바라보도록 설정
const baseURL = import.meta.env.DEV 
  ? SERVER_URL 
  : 'http://223.130.157.123:8080';

const api = axios.create({
  baseURL: baseURL, 
  withCredentials: true, // 세션 쿠키 필수
  timeout: 30000 // 30초
});

export default api;