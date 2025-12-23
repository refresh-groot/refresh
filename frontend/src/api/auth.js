import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

/**
 * 1. 아이디 중복 확인 API
 */
export const checkIdApi = async (id) => {
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