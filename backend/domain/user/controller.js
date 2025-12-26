const service = require('./service');

module.exports = {
  // 아이디 중복 확인
  checkloginId: async (req, res) => {
    try {
      const { loginId } = req.body; 
      const result = await service.checkLoginId(loginId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: '서버 에러', error: error.message });
    }
  },

  // 닉네임 중복 확인
  checkNickname: async (req, res) => {
    try {
      const { nickname } = req.body;
      const result = await service.checkNickname(nickname);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: '서버 에러', error: error.message });
    }
  },

  //  인증 번호 발송 요청
  sendEmail: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: '이메일을 입력해주세요.' });

      const result = await service.sendEmailCode(email);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: '메일 전송에 실패했습니다.', error: error.message });
    }
  },

  //  인증 번호 확인 요청
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

  // 회원가입
  signup: async (req, res) => {
    try {
      const { loginId, password, email, nickname } = req.body;
      
      if (!loginId || !password || !email || !nickname) {
        return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
      }

      await service.signup({ loginId, password, email, nickname });

      return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ message: error.message });
    }
  },
};