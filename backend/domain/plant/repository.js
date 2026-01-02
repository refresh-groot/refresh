// 1. 필요한 모델과 sequelize 객체를 한꺼번에 가져옵니다.
const { Plant, SpeciesInfo, sequelize } = require('../index'); 

module.exports = {
  // --- 기존 식물 관련 로직 ---
  
  // 1. 새로운 식물 생성
  create: async (data) => {
    return await Plant.create(data);
  },

  // 2. 특정 유저의 '활성' 식물 리스트 조회 (SpeciesInfo 가이드 포함)
  findAllActiveByUserId: async (userId) => {
    return await Plant.findAll({
      where: { 
        user_id: userId, 
        status: 'active' 
      },
      include: [{
        model: SpeciesInfo,
        as: 'guide',
        required: false 
      }]
    });
  },

  // 3. 식물의 상태(status) 변경 (보관함 이동 등)
  updateStatus: async (id, status) => {
    return await Plant.update({ status }, { where: { id } });
  },

  // 4. DB에서 영구 삭제
  permanentDelete: async (id) => {
    return await Plant.destroy({ where: { id }, force: true });
  },

  // --- 새로 추가하는 로직 ---

  // 5. 랜덤 미세팁 하나 가져오기 (로딩창 등에 활용)
  getRandomTip: async () => {
    return await SpeciesInfo.findOne({
      order: sequelize.random(), // DB 엔진의 랜덤 함수 호출
      attributes: ['mini_tip']   // 데이터 중 'mini_tip' 컬럼만 뽑아옴
    });
  }
};