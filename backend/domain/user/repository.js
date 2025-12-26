const { User } = require('../index'); 

module.exports = {
  // 아이디로 유저 찾기
  findByLoginId: async (loginId) => {
    return await User.findOne({ where: { loginId } });
  },

  // 닉네임으로 유저 찾기
  findByNickname: async (nickname) => {
    return await User.findOne({ where: { nickname } });
  },

  // 이메일로 유저 찾기
  findByEmail: async (email) => {
    return await User.findOne({ where: { email } });
  },

  // 유저 생성
  createUser: async ({ loginId, password, email, nickname }) => {
    return await User.create({
      loginId,
      password,
      email,
      nickname,
    });
  },
};