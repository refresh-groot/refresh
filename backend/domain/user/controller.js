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
      console.error("====== 메일 전송 상세 에러 시작 ======");
      console.error(error); 
      console.error("====== 메일 전송 상세 에러 끝 ======");
      
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

  // 로그인 처리
  login: async (req, res) => {
    try {
      console.log("==== 로그인 요청 도착 ====");
      console.log("전달된 데이터:", req.body); // { id: '...', pw: '...' } 가 찍힘

      // 프론트에서 보내는 id와 pw로 이름을 맞춰줍니다.
      const { id, pw } = req.body; 
      
      if (!id || !pw) {
        return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
      }

      // service.login 함수에 id와 pw를 넘깁니다.
      const user = await service.login(id, pw);

      // 세션에 유저 정보 저장
      req.session.user = user;

      return res.status(200).json({
        message: '로그인 성공!',
        user: user
      });
    } catch (error) {
      // 인증 실패 (아이디 없음, 비번 틀림)
      return res.status(401).json({ message: error.message });
    }
  },

  // 로그아웃 처리
  logout: (req, res) => {
    req.session.destroy(); 
    return res.status(200).json({ message: '로그아웃 되었습니다.' });
  }
};