const service = require('./service');

module.exports = {
  // 1. 아이디 중복 확인
  checkLoginId: async (req, res) => { // 변경점: checkloginId -> checkLoginId (카멜케이스)
    try {
      const { loginId } = req.body;
      const result = await service.checkLoginId(loginId);
      return res.status(200).json(result);
    } catch (error) {
      console.error("아이디 중복 확인 에러:", error); // 변경점: 에러 로깅 통일
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
      console.error("닉네임 중복 확인 에러:", error);
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
      console.error("이메일 인증 발송 에러:", error);
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
      console.error("이메일 인증 확인 에러:", error);
      return res.status(400).json({ message: error.message });
    }
  },

  // 5. 회원가입 처리
  signup: async (req, res) => {
    try {
      // 일반 회원가입 시 프론트엔드가 보낸 AI 동의 여부(isAiDataAllowed)를 바디에서 꺼내옴
      const { loginId, password, email, nickname, isAiDataAllowed } = req.body;
      await service.signup({ loginId, password, email, nickname, isAiDataAllowed });
      return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
    } catch (error) {
      console.error("회원가입 에러:", error);
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

      // 세션이 스토어에 완전히 저장된 후 응답을 보냅니다.
      req.session.save(() => {
        return res.status(200).json({
          message: '로그인 성공!',
          user: user
        });
      });

    } catch (error) {
      console.error("로그인 에러:", error);
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
      console.error("프로필 조회 에러:", error);
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
      console.error("프로필 수정 에러:", error);
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
      console.error("알림 설정 업데이트 에러:", error);
      return res.status(500).json({ message: '서버 에러' });
    }
  },

  // 11. 회원 탈퇴 (DELETE /withdraw)
  withdraw: async (req, res) => {
    try {
      const id = req.session.user.id;
      const { password } = req.body;

      // Service에게 탈퇴 로직 위임 후 결과 메시지(조건별 분기 메시지) 수신
      const result = await service.withdraw(id, password);

      // 세션 파괴 
      req.session.destroy();            // 서버 쪽 세션 저장소 삭제
      res.clearCookie('connect.sid');   // 사용자 브라우저의 쿠키 삭제

      // 동의 여부에 따라 서비스단에서 만들어진 다이나믹 메시지를 반환합니다.
      return res.status(200).json({ message: result.message });
    } catch (error) {
      if (error.message.includes('비밀번호')) {
        return res.status(401).json({ message: error.message });
      }
      console.error("회원 탈퇴 처리 에러:", error);
      return res.status(500).json({ message: '서버 에러' });
    }
  },

  // 계정 실재 여부를 확인하는 미들웨어 (보안 로직 강화)
  validateUser: async (req, res, next) => {
    try {
      // 1. 세션이나 유저 정보가 아예 없으면 즉시 차단 (기존에는 이 로직이 없어 비로그인 통과 위험이 있었음)
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: '로그인 정보가 없습니다.' });
      }

      // 2. Service를 통해 DB에 유저가 실제로 존재하는지 조회
      const user = await service.getUserById(req.session.user.id);
      
      if (!user || user.status === 'WITHDRAWN') {

          return req.session.destroy(() => {
              res.clearCookie('connect.sid');
              return res.status(401).json({
                  message:'존재하지 않거나 탈퇴한 계정입니다.'
              });
          });

      }
      
      // 3. 모든 검증을 통과했을 때만 다음 로직으로 이동
      next();
    } catch (error) {
      console.error("유저 미들웨어 검증 중 에러:", error);
      // 에러 발생 시 통과시키지 않고 에러 반환
      return res.status(500).json({ message: '인증 서버 통신 에러' });
    }
  },

// 12. 카카오 로그인
  kakaoLogin: async (req, res) => {
    try {
      const { code } = req.query; // 카카오가 전달해준 인가 코드
      
      if (!code) {
        console.error('❌ 카카오 인가 코드가 없습니다.');
        return res.redirect(`${process.env.CLIENT_URL || 'http://223.130.157.123:5173'}/login?error=no_code`);
      }

      // 서비스 로직을 통해 카카오 유저 정보 반환
      const user = await service.kakaoLogin(code);

      // 세션 객체에 유저 정보 할당
      req.session.user = { 
        id: user.id, 
        nickname: user.nickname, 
        loginId: user.loginId 
      };
      
      // 세션 저장 후 프론트엔드로 리다이렉트
      req.session.save(() => {
        return res.redirect(process.env.CLIENT_URL || 'http://223.130.157.123:5173/');
      });
    } catch (error) {
      console.error('❌ 카카오 로그인 에러:', error.response?.data || error.message);
      return res.redirect(`${process.env.CLIENT_URL || 'http://223.130.157.123:5173'}/login?error=kakao_failed`);
    }
  },

  // 13. 구글 로그인
  googleLogin: async (req, res) => {
    try {
      const { code } = req.query; // 구글이 전달해준 인가 코드
      
      if (!code) {
        console.error('❌ 구글 인가 코드가 없습니다.');
        return res.redirect(`${process.env.CLIENT_URL || 'http://223.130.157.123:5173'}/login?error=no_code`);
      }

      // 서비스 로직을 통해 구글 유저 정보 반환
      const user = await service.googleLogin(code);

      // 세션 객체에 유저 정보 할당
      req.session.user = { 
        id: user.id, 
        nickname: user.nickname, 
        loginId: user.loginId 
      };
      
      // 세션 저장 후 프론트엔드로 리다이렉트
      req.session.save(() => {
        return res.redirect(process.env.CLIENT_URL || 'http://223.130.157.123:5173/');
      });
    } catch (error) {
      console.error('❌ 구글 로그인 에러:', error.response?.data || error.message);
      return res.redirect(`${process.env.CLIENT_URL || 'http://223.130.157.123:5173'}/login?error=google_failed`);
    }
  },

// 14. 네이버 로그인 컨트롤러
  naverLogin: async (req, res) => {
    try {
      // 네이버는 인가 코드(code)와 상태 토큰(state)을 함께 전달받습니다.
      const { code, state } = req.query; 
      
      if (!code) {
        console.error('❌ 네이버 인가 코드가 없습니다.');
        return res.redirect(`${process.env.CLIENT_URL || 'http://223.130.157.123:5173'}/login?error=no_code`);
      }

      // 서비스 로직을 통해 네이버 유저 정보 반환
      const user = await service.naverLogin(code, state);

      // 세션 객체에 유저 정보 할당
      req.session.user = { 
        id: user.id, 
        nickname: user.nickname, 
        loginId: user.loginId 
      };
      
      // 세션 저장 후 프론트엔드로 리다이렉트
      req.session.save(() => {
        return res.redirect(process.env.CLIENT_URL || 'http://223.130.157.123:5173/');
      });
    } catch (error) {
      console.error('❌ 네이버 로그인 에러:', error.response?.data || error.message);
      return res.redirect(`${process.env.CLIENT_URL || 'http://223.130.157.123:5173'}/login?error=naver_failed`);
    }
  },

  // 15. 깃허브 로그인 컨트롤러
  githubLogin: async (req, res) => {
    try {
      const { code } = req.query; // 깃허브가 전달해준 인가 코드
      
      if (!code) {
        console.error('❌ 깃허브 인가 코드가 없습니다.');
        return res.redirect(`${process.env.CLIENT_URL || 'http://223.130.157.123:5173'}/login?error=no_code`);
      }

      // 서비스 로직을 통해 깃허브 유저 정보 반환
      const user = await service.githubLogin(code);

      // 세션 객체에 유저 정보 할당
      req.session.user = { 
        id: user.id, 
        nickname: user.nickname, 
        loginId: user.loginId 
      };
      
      // 세션 저장 후 프론트엔드로 리다이렉트
      req.session.save(() => {
        return res.redirect(process.env.CLIENT_URL || 'http://223.130.157.123:5173/');
      });
    } catch (error) {
      console.error('❌ 깃허브 로그인 에러:', error.response?.data || error.message);
      return res.redirect(`${process.env.CLIENT_URL || 'http://223.130.157.123:5173'}/login?error=github_failed`);
    }
  }
};