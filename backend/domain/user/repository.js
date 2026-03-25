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
  // PK(고유 ID)로 유저 찾기
  findById: async (id) => {
    return await User.findByPk(id);
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

  // 소셜 ID와 가입 경로(provider)로 유저 찾기
  findBySnsIdAndProvider: async (snsId, provider) => {
    return await User.findOne({ where: { sns_id: snsId, provider: provider } });
  },

  // 소셜 유저 전용 생성 (비밀번호 없음)
  createSocialUser: async ({ loginId, email, nickname, provider, snsId }) => {
    return await User.create({
      loginId,
      password: null, // 소셜은 비밀번호 null
      email,
      nickname,
      provider,
      sns_id: snsId,
    });
  }
};