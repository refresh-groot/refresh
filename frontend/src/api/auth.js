import api from './axios';

/** 아이디 중복 확인 */
export const checkIdApi = async (loginId) => {
  const res = await api.post('/api/user/check/id', { loginId });
  return res.data;
};

/** 닉네임 중복 확인 */
export const checkNicknameApi = async (nickname) => {
  const res = await api.post('/api/user/check/nickname', { nickname });
  return res.data;
};

/** 회원가입 */
export const signupApi = async (userData) => {
  const res = await api.post('/api/user/signup', userData);
  return res.data;
};

/** 로그인 */
export const loginApi = async (loginData) => {
  const res = await api.post('/api/user/login', loginData);
  return res.data;
};

/** 이메일 인증 코드 발송 */
export const sendEmailCodeApi = async (email) => {
  const res = await api.post('/api/user/email/send', { email });
  return res.data;
};

/** 이메일 인증 코드 확인 */
export const verifyEmailCodeApi = async (email, code) => {
  const res = await api.post('/api/user/email/verify', { email, code });
  return res.data;
};
