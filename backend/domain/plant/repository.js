// backend/domain/plant/repository.js

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

  // 3. 식물의 상태(status) 변경 (일반적인 상태 변경)
  updateStatus: async (id, status) => {
    return await Plant.update({ status }, { where: { id } });
  },

  // 4. [추가된 기능] 식물 상태 변경 및 사망 이유 기록 (연필 아이콘 대응)
  // 보관함으로 이동하면서 왜 죽었는지를 함께 저장합니다.
  updateStatusWithReason: async (id, status, reason) => {
    return await Plant.update(
      { 
        status: status,           // 'archived'로 변경
        death_reason: reason      // 프론트에서 보낸 '과습', '물 부족' 등 저장
      }, 
      { where: { id } }
    );
  },

  // 5. DB에서 영구 삭제 (쓰레기통 아이콘 대응)
  // force: true를 통해 DB에서 데이터를 완전히 지웁니다.
  permanentDelete: async (id) => {
    return await Plant.destroy({ where: { id }, force: true });
  },

  // 6. 랜덤 미세팁 하나 가져오기 (로딩창 등에 활용)
  getRandomTip: async () => {
    return await SpeciesInfo.findOne({
      order: sequelize.random(), 
      attributes: ['mini_tip']   
    });
  }
};