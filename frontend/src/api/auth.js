import axios from 'axios';

// 백엔드 주소 (나중에 팀원이 주소 알려주면 여기만 딱 바꾸면 끝!)
const BASE_URL = 'http://localhost:8000/api';

/**
 * 1. 아이디 중복 확인 API
 */
export const checkIdApi = async (id) => {
  // axios.post('http://localhost:8000/api/check/id', { id: id }) 와 같은 뜻
  const response = await axios.post(`${BASE_URL}/check/id`, { id });
  return response.data;
};

/**
 * 2. 닉네임 중복 확인 API
 */
export const checkNicknameApi = async (nickname) => {
  const response = await axios.post(`${BASE_URL}/check/nickname`, { nickname });
  return response.data;
};

/**
 * 3. 회원가입 요청 API
 */
export const signupApi = async (userData) => {
  // userData 안에는 { id, pw, email... } 등이 들어있음
  const response = await axios.post(`${BASE_URL}/signup`, userData);
  return response.data;
};

/**
 * 4. 로그인 요청 API (나중에 추가할 것)
 */
export const loginApi = async (loginData) => {
    const response = await axios.post(`${BASE_URL}/login`, loginData);
    return response.data;
};