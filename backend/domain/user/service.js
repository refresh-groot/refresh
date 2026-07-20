const bcrypt = require('bcrypt');
const repository = require('./repository');
const mailer = require('../../utils/mailer'); 
const { User } = require('../index');
const axios = require('axios');

// 인증번호 임시 저장소 및 타이머 관리
const verificationCodes = {}; 
const verificationTimers = {}; 

module.exports = {
  // 1. 아이디 중복 확인 
  checkLoginId: async (loginId) => {
    const existingUser = await repository.findByLoginId(loginId);
    return { isDuplicate: !!existingUser }; // 삼항 연산자 대신 논리 연산자로 간결화
  },

  // 2. 닉네임 중복 확인 
  checkNickname: async (nickname) => {
    const existingUser = await repository.findByNickname(nickname);
    return { isDuplicate: !!existingUser };
  },

  // 3. 이메일 인증 번호 발송 
  sendEmailCode: async (email) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[email] = code;
    console.log(`[메일발송] ${email} -> 번호: ${code}`); 

    await mailer.sendVerificationCode(email, code);

    // 기존에 작동 중인 타이머가 있다면 취소 (연속 요청 시 메모리 누수 방지)
    if (verificationTimers[email]) {
      clearTimeout(verificationTimers[email]);
    }

    // 3분 후 인증번호 만료
    verificationTimers[email] = setTimeout(() => {
      delete verificationCodes[email];
      delete verificationTimers[email];
    }, 3 * 60 * 1000); 

    return { message: '인증 번호가 발송되었습니다.' };
  },

  // 4. 이메일 인증 번호 검증 
  verifyEmailCode: async (email, code) => {
    const savedCode = verificationCodes[email];
    if (!savedCode) throw new Error('인증 번호가 만료되었거나 요청하지 않았습니다.');
    if (savedCode !== code) throw new Error('인증 번호가 일치하지 않습니다.');

    // 인증 성공 시 저장소 및 타이머에서 즉시 삭제
    delete verificationCodes[email];
    if (verificationTimers[email]) {
      clearTimeout(verificationTimers[email]);
      delete verificationTimers[email];
    }
    return { verified: true };
  },

  // 5. 회원가입 (일반)
  signup: async ({ loginId, password, email, nickname, isAiDataAllowed }) => {
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
      isAiDataAllowed
    });
    return newUser;
  },

  // 6. 로그인 (일반)
  login: async (loginId, password) => {
    const user = await repository.findByLoginId(loginId);
    // 탈퇴한 회원이거나 유저가 없는 경우 차단
    if (!user || user.status === 'WITHDRAWN') throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');

    // 컨트롤러에서 세션에 담기 편하도록 필요한 객체만 필터링하여 반환
    return { id: user.id, loginId: user.loginId, nickname: user.nickname, email: user.email };
  },

  // 7. ID로 사용자 정보 조회 (validateUser 미들웨어 등에서 사용)
  getUserById: async (id) => {
    return await repository.findById(id); 
  },

  // 8. 프로필 조회
  getProfile: async (id) => {
    const user = await repository.findById(id);
    if (!user) throw new Error('유저를 찾을 수 없습니다.');
    return {
      nickname: user.nickname,
      email: user.email,
      bio: user.bio,
      isAlertOn: user.isAlertOn
    };
  },
  
  // 9. 프로필(소개글) 수정
  updateProfile: async (id, bio) => {
    await User.update({ bio }, { where: { id } });
  },

  // 10. 알림 설정 변경 (ON/OFF)
  updateAlert: async (id, isAlertOn) => {
    await User.update(
      { isAlertOn },
      { where: { id } }
    );
  },

  // 11. 회원 탈퇴
  withdraw: async (id, password) => {
    const user = await repository.findById(id);
    if (!user) throw new Error('유저를 찾을 수 없습니다.');

    // 일반(로컬) 가입자인 경우에만 비밀번호 검증 진행
    if (user.provider === 'local') {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new Error('비밀번호가 일치하지 않습니다.');
    }

    // AI 학습 데이터 동의 여부에 따른 분기 처리
    if (user.isAiDataAllowed) {
      await repository.anonymizeUser(id);
      return { message: '회원 탈퇴가 완료되었습니다. 데이터는 비식별화되어 AI 학습용으로 안전하게 보존됩니다.' };
    } else {
      await repository.hardDeleteUser(id);
      return { message: '회원 탈퇴가 완료되었으며, 모든 개인 데이터가 완전히 파기되었습니다.' };
    }
  },

  // 12. 카카오 로그인
  kakaoLogin: async (code) => {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', process.env.KAKAO_CLIENT_ID);
    params.append('redirect_uri', process.env.KAKAO_REDIRECT_URI); 
    params.append('client_secret', process.env.KAKAO_CLIENT_SECRET); 
    params.append('code', code);
    
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      params,
      { headers: { 'Content-type': 'application/x-www-form-urlencoded;charset=utf-8' } }
    );

    const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}`, 'Content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
    });

    const userInfo = userInfoResponse.data;
    const snsId = userInfo.id.toString(); 
    const nickname = userInfo.kakao_account?.profile?.nickname || `카카오_${snsId.substring(0, 5)}`;
    const email = userInfo.kakao_account?.email || `${snsId}@kakao.com`; 
    const loginId = `kakao_${snsId}`; 

    let user = await repository.findBySnsIdAndProvider(snsId, 'kakao');
    if (user && user.status === 'WITHDRAWN') {
      throw new Error('탈퇴한 계정입니다.');
    }
    if (!user) {
      user = await repository.createSocialUser({ loginId, email, nickname, provider: 'kakao', snsId });
    }
    return user; 
  },

  // 13. 구글 로그인
  googleLogin: async (code) => {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID, 
      client_secret: process.env.GOOGLE_CLIENT_SECRET, 
      code, 
      grant_type: 'authorization_code', 
      redirect_uri: process.env.GOOGLE_REDIRECT_URI
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
    if (user && user.status === 'WITHDRAWN') {
      throw new Error('탈퇴한 계정입니다.');
    }
    if (!user) {
      user = await repository.createSocialUser({ loginId, email, nickname, provider: 'google', snsId });
    }
    return user;
  },

  // 14. 네이버 로그인
  naverLogin: async (code, state) => {
    const tokenUrl = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${process.env.NAVER_CLIENT_ID}&client_secret=${process.env.NAVER_CLIENT_SECRET}&code=${code}&state=${state}`;
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
    if (user && user.status === 'WITHDRAWN') {
      throw new Error('탈퇴한 계정입니다.');
    }
    if (!user) {
      user = await repository.createSocialUser({ loginId, email, nickname, provider: 'naver', snsId });
    }
    return user;
  },

  // 15. 깃허브 로그인
  githubLogin: async (code) => {
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID, 
      client_secret: process.env.GITHUB_CLIENT_SECRET, 
      code
    }, { headers: { Accept: 'application/json' } });

    const accessToken = tokenResponse.data.access_token;

    const userInfoResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userInfo = userInfoResponse.data;
    const snsId = userInfo.id.toString();
    const nickname = userInfo.login || `깃허브_${snsId.substring(0, 5)}`;
    const loginId = `github_${snsId}`;

    // 깃허브 이메일 비공개 방어 로직 (배열 비어있을 경우 안전장치)
    let email = userInfo.email;
    if (!email) {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const primaryEmail = emailResponse.data.find(e => e.primary && e.verified);
      email = primaryEmail ? primaryEmail.email : `${snsId}@github.com`;
    }

    let user = await repository.findBySnsIdAndProvider(snsId, 'github');
    if (user && user.status === 'WITHDRAWN') {
      throw new Error('탈퇴한 계정입니다.');
    }
    if (!user) {
      user = await repository.createSocialUser({ loginId, email, nickname, provider: 'github', snsId });
    }
    return user;
  }
};