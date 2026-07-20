const { User } = require('../index');

module.exports = {
  // 1. 아이디로 유저 찾기
  findByLoginId: async (loginId) => {
    return await User.findOne({
      where: { loginId }
    });
  },

  // 2. 닉네임으로 유저 찾기
  findByNickname: async (nickname) => {
    return await User.findOne({
      where: { nickname }
    });
  },

  // 3. 이메일로 유저 찾기
  findByEmail: async (email) => {
    return await User.findOne({
      where: { email }
    });
  },

  // 4. PK(고유 ID)로 유저 찾기
  findById: async (id) => {
    return await User.findByPk(id);
  },

  // 5. 일반 회원가입
  createUser: async ({
    loginId,
    password,
    email,
    nickname,
    isAiDataAllowed
  }) => {
    return await User.create({
      loginId,
      password,
      email,
      nickname,
      isAiDataAllowed: isAiDataAllowed || false,
      status: 'ACTIVE'
    });
  },

  // 6. 소셜 ID + Provider 조회
  findBySnsIdAndProvider: async (snsId, provider) => {
    return await User.findOne({
      where: {
        snsId,
        provider
      }
    });
  },

  // 7. 소셜 회원 생성
  createSocialUser: async ({
    loginId,
    email,
    nickname,
    provider,
    snsId
  }) => {
    return await User.create({
      loginId,
      password: null,
      email,
      nickname,
      provider,
      snsId,
      status: 'ACTIVE'
    });
  },

  // 8. 회원 완전 삭제
  hardDeleteUser: async (id) => {
    return await User.destroy({
      where: { id }
    });
  },

  // 9. 회원 익명화
  anonymizeUser: async (id) => {
    const randomSuffix = Date.now().toString().slice(-6);

    return await User.update(
      {
        loginId: `withdrawn_${id}_${randomSuffix}`,
        password: 'WIPED_PASSWORD',
        email: `deleted_${id}_${randomSuffix}@refresh.com`,
        nickname: `withdrawn_${id}_${randomSuffix}`,
        status: 'WITHDRAWN',
        snsId: null
      },
      {
        where: { id }
      }
    );
  }
};