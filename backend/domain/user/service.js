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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('비밀번호가 일치하지 않습니다.');

    // AI 학습 데이터 동의 여부에 따른 분기 처리
    if (user.isAiDataAllowed) {
      await repository.anonymizeUser(id);
      return { message: '회원 탈퇴가 완료되었습니다. 데이터는 비식별화되어 AI 학습용으로 안전하게 보존됩니다.' };
    } else {
      await repository.hardDeleteUser(id);
      return { message: '회원 탈퇴가 완료되었으며, 모든 개인 데이터가 완전히 파기되었습니다.' };
    }
  }
};