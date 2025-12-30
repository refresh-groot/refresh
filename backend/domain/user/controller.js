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
      // Joi가 이메일 형식을 검사했으므로 if (!email) 삭제 가능

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
      // 여기도 Joi가 있다면 뺄 수 있지만, 안전을 위해 두셔도 됩니다.
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
      
      // 복잡한 if문 검사 싹 제거! (Joi가 이미 했음)
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
      
      // 로그인은 Joi를 안 거쳤다면 이 검사는 필수!
      if (!id || !pw) {
        return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
      }

      const user = await service.login(id, pw);

      req.session.user = user;

      return res.status(200).json({
        message: '로그인 성공!',
        user: user
      });
    } catch (error) {
      return res.status(401).json({ message: error.message });
    }
  },

  // 7. 로그아웃 처리
  logout: (req, res) => {
    req.session.destroy(); 
    return res.status(200).json({ message: '로그아웃 되었습니다.' });
  },

  // 계정 실재 여부를 확인하는 미들웨어
  validateUser: async (req, res, next) => {
    try {
      // 세션에 유저 정보가 있는지 확인합니다.
      if (req.session && req.session.user) {
        // 세션의 ID로 DB를 다시 조회하여 삭제 여부를 확인합니다.
        const user = await service.getUserById(req.session.user.id);
        
        if (!user) {
          // DB에 유저가 없다면 세션을 파괴하고 쿠키를 삭제합니다.
          return req.session.destroy(() => {
            res.clearCookie('connect.sid'); 
            return res.status(401).json({ message: '존재하지 않거나 삭제된 계정입니다.' });
          });
        }
      }
      // 문제가 없으면 다음 로직으로 진행합니다.
      next();
    } catch (error) {
      console.error("유저 검증 중 에러:", error);
      next(); 
    }
  }
};