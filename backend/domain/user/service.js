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
    // 바로 인증번호 생성 및 발송
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

    if (!savedCode) {
      throw new Error('인증 번호가 만료되었거나 요청하지 않았습니다.');
    }

    if (savedCode !== code) {
      throw new Error('인증 번호가 일치하지 않습니다.');
    }

    delete verificationCodes[email];
    return { verified: true };
  },

  // 5. 회원가입 
  signup: async ({ loginId, password, email, nickname }) => {
    // (1) 아이디 중복 체크 
    const existingId = await repository.findByLoginId(loginId);
    if (existingId) throw new Error('이미 존재하는 아이디입니다.');

    // (2) 닉네임 중복 체크 
    const existingNickname = await repository.findByNickname(nickname);
    if (existingNickname) throw new Error('이미 존재하는 닉네임입니다.');

    // (3) 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // (4) DB 저장 (같은 이메일이어도 아이디만 다르면 저장됨)
    const newUser = await repository.createUser({
      loginId,
      password: hashedPassword,
      email,
      nickname,
    });
    return newUser;
  },
  // 6. 로그인 (중요: signup 함수 밖에 독립적으로 있어야 함)
  login: async (loginId, password) => {
    const user = await repository.findByLoginId(loginId);
  
    if (!user) {
      throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    return {
      id: user.id,
      loginId: user.loginId,
      nickname: user.nickname,
      email: user.email
    };
  },
// 7. ID로 사용자 정보 조회 (세션 검증용)
  getUserById: async (id) => {
    // repository의 findById 기능을 사용하여 DB에 해당 ID가 있는지 확인
    return await repository.findById(id); 
  },
  // 8. 프로필 조회 서비스
  getProfile: async (id) => {
    const user = await repository.findById(id);
    if (!user) throw new Error('유저를 찾을 수 없습니다.');
    // 필요한 정보만 리턴
    return { 
      nickname: user.nickname, 
      email: user.email, 
      bio: user.bio,
      isAlertOn: user.is_alert_on 
    };
  },
  
  // 9. 프로필 수정 서비스
  updateProfile: async (id, bio) => {
    // repository에 update 기능이 없으므로 User 모델 직접 사용
    await User.update({ bio }, { where: { id } });
  },

  // 10. 알림 설정 변경 (ON/OFF)
  updateAlert: async (id, isAlertOn) => {
    await User.update({ is_alert_on: isAlertOn }, { where: { id } });
  },

  // 11. 회원 탈퇴 서비스
  withdraw: async (id, password) => {
    // (1) 유저 찾기
    const user = await repository.findById(id);
    if (!user) throw new Error('유저를 찾을 수 없습니다.');

    // (2) 비밀번호 검증
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('비밀번호가 일치하지 않습니다.');

    // (3) 삭제 (Hard Delete + Cascade)
    await User.destroy({ where: { id } });
  },

  // 12. 카카오 소셜 로그인 비즈니스 로직
  kakaoLogin: async (code) => {
    const KAKAO_CLIENT_ID = 'd1beca23f694938a7163a0e4629d6f4a'; // REST API 키 입력
    const KAKAO_REDIRECT_URI = 'http://localhost:8080/api/user/auth/kakao/callback';

    // 카카오 서버로 토큰 요청
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      {
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID,
        redirect_uri: KAKAO_REDIRECT_URI,
        code: code,
      },
      { headers: { 'Content-type': 'application/x-www-form-urlencoded;charset=utf-8' } }
    );

    const kakaoToken = tokenResponse.data.access_token;

    // 카카오 유저 정보 요청
    const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${kakaoToken}`,
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    const userInfo = userInfoResponse.data;
    const snsId = userInfo.id.toString(); 
    const nickname = userInfo.kakao_account.profile.nickname;
    
    // DB 제약조건에 맞게 가짜 이메일/아이디 생성
    const email = userInfo.kakao_account.email || `${snsId}@kakao.com`; 
    const loginId = `kakao_${snsId}`; 

    // DB 조회 (Repository 사용)
    let user = await repository.findBySnsIdAndProvider(snsId, 'kakao');

    // 강제 회원가입 (Repository 사용)
    if (!user) {
      user = await repository.createSocialUser({
        loginId,
        email,
        nickname,
        provider: 'kakao',
        snsId
      });
    }
    // 컨트롤러에게 완성된 유저 정보만 딱 넘겨줌
    return user; 
  }
};