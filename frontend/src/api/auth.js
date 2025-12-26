import axios from 'axios';
import { SERVER_URL } from '../app/constants'; // 서버주소 바꿔주면 됨
                                              // 호출주소 맞는지 체크 /check/id이런 부분 다 맞는지 확인하고 틀릴경우 백엔드 주소랑 맞게 변경
/**
 * 1. 아이디 중복 확인 API
 */
export const checkIdApi = async (loginId) => {
  const response = await axios.post(`${SERVER_URL}/check/id`, { loginId });
  return response.data;
};

/**
 * 2. 닉네임 중복 확인 API
 */
export const checkNicknameApi = async (nickname) => {
  const response = await axios.post(`${SERVER_URL}/check/nickname`, { nickname });
  return response.data;
};

/**
 * 3. 회원가입 요청 API
 */
export const signupApi = async (userData) => {
  const response = await axios.post(`${SERVER_URL}/signup`, userData);
  return response.data;
};

/**
 * 4. 로그인 요청 API
 */
export const loginApi = async (loginData) => {
    const response = await axios.post(`${SERVER_URL}/login`, loginData);
    return response.data;
};

/**
 * 5. 이메일 인증번호 발송 API
 */
export const sendEmailCodeApi = async (email) =>{
  const response = await axios.post(`${SERVER_URL}/email/send`, {email});
  return response.data;
}

/**
 * 6. 이메일 인증번호 확인 API
 */
export const verifyEmailCodeApi = async (email, code) => {
  const response = await axios.post(`${SERVER_URL}/email/verify`, {email, code});
  return response.data;
}