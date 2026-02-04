import axios from 'axios';
import { SERVER_URL } from '../app/constants';

const api = axios.create({
  // http://localhost:8080 (백엔드로 직접 요청)
  baseURL: 'http://localhost:8080',   
  
  withCredentials: true, // 세션 쿠키 필수

  // 👇 [이 부분이 핵심!] 이 줄이 없어서 계속 끊기는 겁니다. 꼭 추가해주세요!
  timeout: 30000, // 30초 (AI가 5초 넘게 걸려도 참을성 있게 기다림)
});

export default api;