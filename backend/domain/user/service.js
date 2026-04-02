const bcrypt = require('bcrypt');
const repository = require('./repository');
const mailer = require('../../utils/mailer'); 
const { User } = require('../index');
const axios = require('axios');

// 인증번호 임시 저장소
let verificationCodes = {}; 

module.exports = {
  // 1. 아이디 중복 확인 
  checkLoginId: async (loginId) => {
    const existingUser = await repository.findByLoginId(loginId);
    if (existingUser) {
      return { isDuplicate: true };
    }
    return { isDuplicate: false };
  },

  // 2. 닉네임 중복 확인 
  checkNickname: async (nickname) => {
    const existingUser = await repository.findByNickname(nickname);
    if (existingUser) {
      return { isDuplicate: true };
    }
    return { isDuplicate: false };
  },

  // 3. 이메일 인증 번호 발송 
  sendEmailCode: async (email) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[email] = code;
    console.log(`[메일발송] ${email} -> 번호: ${code}`); 

    await mailer.sendVerificationCode(email, code);

    setTimeout(() => {
      delete verificationCodes[email];
    }, 3 * 60 * 1000); 

    return { message: '인증 번호가 발송되었습니다.' };
  },

  // 4. 이메일 인증 번호 검증 
  verifyEmailCode: async (email, code) => {
    const savedCode = verificationCodes[email];
    if (!savedCode) throw new Error('인증 번호가 만료되었거나 요청하지 않았습니다.');
    if (savedCode !== code) throw new Error('인증 번호가 일치하지 않습니다.');

    delete verificationCodes[email];
    return { verified: true };
  },

  // 5. 회원가입 
  signup: async ({ loginId, password, email, nickname }) => {
    const existingId = await repository.findByLoginId(loginId);
    if (existingId) throw new Error('이미 존재하는 아이디입니다.');

    const existingNickname = await repository.findByNickname(nickname);
    if (existingNickname) throw new Error('이미 존재하는 닉네임입니다.');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await repository.createUser({
      loginId,
      password: hashedPassword,
      email,
      nickname,
    });
    return newUser;
  },

  // 6. 로그인 
  login: async (loginId, password) => {
    const user = await repository.findByLoginId(loginId);
    if (!user) throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');

    return { id: user.id, loginId: user.loginId, nickname: user.nickname, email: user.email };
  },

  // 7. ID로 사용자 정보 조회
  getUserById: async (id) => {
    return await repository.findById(id); 
  },

  // 8. 프로필 조회 서비스
  getProfile: async (id) => {
    const user = await repository.findById(id);
    if (!user) throw new Error('유저를 찾을 수 없습니다.');
    return { nickname: user.nickname, email: user.email, bio: user.bio, isAlertOn: user.is_alert_on };
  },
  
  // 9. 프로필 수정 서비스
  updateProfile: async (id, bio) => {
    await User.update({ bio }, { where: { id } });
  },

  // 10. 알림 설정 변경 (ON/OFF)
  updateAlert: async (id, isAlertOn) => {
    await User.update({ is_alert_on: isAlertOn }, { where: { id } });
  },

  // 11. 회원 탈퇴 서비스
  withdraw: async (id, password) => {
    const user = await repository.findById(id);
    if (!user) throw new Error('유저를 찾을 수 없습니다.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('비밀번호가 일치하지 않습니다.');

    await User.destroy({ where: { id } });
  },

  // 12. 카카오 로그인
  kakaoLogin: async (code) => {
    const KAKAO_CLIENT_ID = 'd1beca23f694938a7163a0e4629d6f4a'; 
    const KAKAO_REDIRECT_URI = 'http://223.130.157.123:8080/api/user/auth/kakao/callback';

    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      { grant_type: 'authorization_code', client_id: KAKAO_CLIENT_ID, redirect_uri: KAKAO_REDIRECT_URI, code: code },
      { headers: { 'Content-type': 'application/x-www-form-urlencoded;charset=utf-8' } }
    );

    const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}`, 'Content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
    });

    const userInfo = userInfoResponse.data;
    const snsId = userInfo.id.toString(); 
    const nickname = userInfo.kakao_account.profile.nickname;
    const email = userInfo.kakao_account.email || `${snsId}@kakao.com`; 
    const loginId = `kakao_${snsId}`; 

    let user = await repository.findBySnsIdAndProvider(snsId, 'kakao');
    if (!user) {
      user = await repository.createSocialUser({ loginId, email, nickname, provider: 'kakao', snsId });
    }
    return user; 
  },

  // 13. 구글 로그인
  googleLogin: async (code) => {
    const GOOGLE_CLIENT_ID = '구글_클라이언트_ID_입력';
    const GOOGLE_CLIENT_SECRET = '구글_클라이언트_비밀번호_입력';
    const GOOGLE_REDIRECT_URI = 'http://223.130.157.123:8080/api/user/auth/google/callback';

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, code, grant_type: 'authorization_code', redirect_uri: GOOGLE_REDIRECT_URI
    });

    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    const userInfo = userInfoResponse.data;
    const snsId = userInfo.id.toString();
    const email = userInfo.email;
    const nickname = userInfo.name || `구글_${snsId.substring(0, 5)}`;
    const loginId = `google_${snsId}`;

    let user = await repository.findBySnsIdAndProvider(snsId, 'google');
    if (!user) {
      user = await repository.createSocialUser({ loginId, email, nickname, provider: 'google', snsId });
    }
    return user;
  },

  // 14. 네이버 로그인
  naverLogin: async (code, state) => {
    const NAVER_CLIENT_ID = '네이버_클라이언트_ID_입력';
    const NAVER_CLIENT_SECRET = '네이버_클라이언트_비밀번호_입력';

    const tokenUrl = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${NAVER_CLIENT_ID}&client_secret=${NAVER_CLIENT_SECRET}&code=${code}&state=${state}`;
    const tokenResponse = await axios.get(tokenUrl);

    const userInfoResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    const userInfo = userInfoResponse.data.response;
    const snsId = userInfo.id.toString();
    const email = userInfo.email;
    const nickname = userInfo.nickname || `네이버_${snsId.substring(0, 5)}`;
    const loginId = `naver_${snsId}`;

    let user = await repository.findBySnsIdAndProvider(snsId, 'naver');
    if (!user) {
      user = await repository.createSocialUser({ loginId, email, nickname, provider: 'naver', snsId });
    }
    return user;
  },

  // 15. 깃허브 로그인
  githubLogin: async (code) => {
    const GITHUB_CLIENT_ID = '깃허브_클라이언트_ID_입력';
    const GITHUB_CLIENT_SECRET = '깃허브_클라이언트_비밀번호_입력';

    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code
    }, { headers: { Accept: 'application/json' } });

    const accessToken = tokenResponse.data.access_token;

    const userInfoResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userInfo = userInfoResponse.data;
    const snsId = userInfo.id.toString();
    const nickname = userInfo.login || `깃허브_${snsId.substring(0, 5)}`;
    const loginId = `github_${snsId}`;

    // 깃허브 이메일 비공개 방어 로직
    let email = userInfo.email;
    if (!email) {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const primaryEmail = emailResponse.data.find(e => e.primary);
      email = primaryEmail ? primaryEmail.email : `${snsId}@github.com`;
    }

    let user = await repository.findBySnsIdAndProvider(snsId, 'github');
    if (!user) {
      user = await repository.createSocialUser({ loginId, email, nickname, provider: 'github', snsId });
    }
    return user;
  }
};