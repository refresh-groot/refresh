const service = require('./service');

module.exports = {
  // 1. 아이디 중복 확인
  checkloginId: async (req, res) => {
    try {
      const { loginId } = req.body;
      const result = await service.checkLoginId(loginId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: '서버 에러', error: error.message });
    }
  },

  // 2. 닉네임 중복 확인
  checkNickname: async (req, res) => {
    try {
      const { nickname } = req.body;
      const result = await service.checkNickname(nickname);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: '서버 에러', error: error.message });
    }
  },

  // 3. 이메일 인증 번호 발송
  sendEmail: async (req, res) => {
    try {
      const { email } = req.body;
      const result = await service.sendEmailCode(email);
      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: '메일 전송 실패', error: error.message });
    }
  },

  // 4. 이메일 인증 번호 확인
  verifyEmail: async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ message: '이메일과 코드를 입력해주세요.' });

      const result = await service.verifyEmailCode(email, code);
      return res.status(200).json({ message: '이메일 인증 성공!', result });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  },

  // 5. 회원가입
  signup: async (req, res) => {
    try {
      const { loginId, password, email, nickname } = req.body;
      await service.signup({ loginId, password, email, nickname });
      return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  },

  // 6. 로그인 처리
  login: async (req, res) => {
  try {
    const { id, pw } = req.body;
    if (!id || !pw) {
      return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
    }

    const user = await service.login(id, pw);

    // 세션 객체에 유저 정보 할당
    req.session.user = user;

    // [수정 중요!] 세션이 스토어에 완전히 저장된 후 응답을 보냅니다.
    req.session.save(() => {
      return res.status(200).json({
        message: '로그인 성공!',
        user: user
      });
    });

  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
},

  // 7. 로그아웃 처리
  logout: (req, res) => {
    req.session.destroy();
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: '로그아웃 되었습니다.' });
  },

  check: (req, res) => {
    // 세션에 유저 정보가 있는지 확인
    if (req.session && req.session.user) {
      return res.status(200).json({
        user: req.session.user,
        message: '로그인 된 상태입니다.'
      });
    } else {
      // 정보가 없으면 401(인증되지 않음) 응답
      return res.status(401).json({ message: '로그인 정보가 없습니다.' });
    }
  },

  // 8. 프로필 조회 (GET /profile)
  getProfile: async (req, res) => {
    try {
      const id = req.session.user.id;

      const userProfile = await service.getProfile(id);

      return res.status(200).json(userProfile);
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }
  },

  // 9. 프로필 수정 (PUT /profile)
  updateProfile: async (req, res) => {
    try {
      const id = req.session.user.id;
      const { bio } = req.body;

      if (bio !== undefined) {
        await service.updateProfile(id, bio);
      }

      return res.status(200).json({ message: '소개글이 수정되었습니다.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: '서버 에러' });
    }
  },
  // 10. 알림 설정 변경
  updateAlert: async (req, res) => {
    try {
      const id = req.session.user.id;
      const { isAlertOn } = req.body; // true 또는 false

      await service.updateAlert(id, isAlertOn);

      return res.status(200).json({ 
        message: `알림이 ${isAlertOn ? '켜졌습니다' : '꺼졌습니다'}.` 
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: '서버 에러' });
    }
  },

  // 11. 회원 탈퇴 (DELETE /withdraw)
  withdraw: async (req, res) => {
    try {
      const id = req.session.user.id;
      const { password } = req.body;

      // Service에게 탈퇴 로직 위임
      await service.withdraw(id, password);

      // 세션 파괴 
      req.session.destroy();            // 서버 쪽 세션 저장소 삭제
      res.clearCookie('connect.sid');   // 사용자 브라우저의 쿠키 삭제

      return res.status(200).json({ message: '회원 탈퇴가 완료되었습니다.' });
    } catch (error) {
      if (error.message.includes('비밀번호')) {
        return res.status(401).json({ message: error.message });
      }
      console.error(error);
      return res.status(500).json({ message: '서버 에러' });
    }
  },

  // 계정 실재 여부를 확인하는 미들웨어
  validateUser: async (req, res, next) => {
    try {
      if (req.session && req.session.user) {
        // Service를 통해 유저 조회
        const user = await service.getUserById(req.session.user.id);
        
        if (!user) {
          return req.session.destroy(() => {
            res.clearCookie('connect.sid');
            return res.status(401).json({ message: '존재하지 않거나 삭제된 계정입니다.' });
          });
        }
      }
      next();
    } catch (error) {
      console.error("유저 검증 중 에러:", error);
      next();
    }
  },

  // 12. 카카오 로그인
  kakaoLogin: async (req, res) => {
    try {
      const { code } = req.query; // 요청(URL)에서 코드만 쏙 뽑음
      const user = await service.kakaoLogin(code);

      // 리턴받은 user 정보로 세션 저장
      req.session.user = { id: user.id, nickname: user.nickname, loginId: user.loginId };

      req.session.save(() => {
        // 성공 시 메인화면으로 리다이렉트
        return res.redirect('http://localhost:5173/');
      });

    } catch (error) {
      console.error('❌ 카카오 로그인 에러:', error.response?.data || error.message);
      return res.redirect('http://localhost:5173/login?error=kakao_failed');
    }
  }
};