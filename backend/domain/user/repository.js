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

  // 유저 생성 (일반 회원가입) - 👇 [수정] isAiDataAllowed 추가
  createUser: async ({ loginId, password, email, nickname, isAiDataAllowed }) => {
    return await User.create({
      loginId,
      password,
      email,
      nickname,
      is_ai_data_allowed: isAiDataAllowed || false, // 프론트에서 넘어온 동의 여부 저장
      status: 'ACTIVE' // 기본 상태 지정
    });
  },

  // 소셜 ID와 가입 경로(provider)로 유저 찾기
  findBySnsIdAndProvider: async (snsId, provider) => {
    return await User.findOne({ where: { sns_id: snsId, provider: provider } });
  },

  // 소셜 유저 전용 생성 (비밀번호 없음) - 👇 [수정] 상태 및 동의여부 추가
  createSocialUser: async ({ loginId, email, nickname, provider, snsId }) => {
    return await User.create({
      loginId,
      password: null, // 소셜은 비밀번호 null
      email,
      nickname,
      provider,
      sns_id: snsId,
      status: 'ACTIVE'
    });
  },


  //  완전 삭제 (AI 학습 미동의 회원용)
  hardDeleteUser: async (id) => {
    return await User.destroy({ 
      where: { id }, 
      force: true // 완전 삭제 처리 (연결된 식물, 데이터 등 CASCADE 삭제 발동)
    });
  },

  //  익명화 처리 (AI 학습 동의 회원용)
  anonymizeUser: async (id) => {
    // 유니크(unique) 제약 조건 충돌(아이디 중복 등)을 막기 위한 난수 생성
    const randomSuffix = Date.now().toString().slice(-6); 
    return await User.update(
      {
        loginId: `withdrawn_${id}_${randomSuffix}`,
        password: 'WIPED_PASSWORD', // 비밀번호 파기
        email: `deleted_${id}_${randomSuffix}@refresh.com`, // 이메일 파기 (더미 값)
        nickname: `탈퇴한 사용자 ${id}`, // 닉네임 비식별화
        status: 'WITHDRAWN', // 상태를 탈퇴로 변경
        sns_id: null, // 소셜 연동 정보 파기
      },
      { where: { id } }
    );
  }
};