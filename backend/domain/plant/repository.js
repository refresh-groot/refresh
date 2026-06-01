// backend/domain/plant/repository.js
const { Plant, SpeciesInfo, sequelize } = require('../index'); 

module.exports = {
  create: async (data) => {
    return await Plant.create(data);
  },
//where부분 status: active빼야 사망 처리된 식물까지 불러와짐
  findAllActiveByUserId: async (userId) => {
    return await Plant.findAll({
      where: { user_id: userId},
      include: [{ model: SpeciesInfo, as: 'guide', required: false,  order: [['reg_date', 'DESC']]}]
    });
  },

  updateStatus: async (id, status) => {
    return await Plant.update({ status }, { where: { id } });
  },

  // [확인] 연필 아이콘 클릭 시 호출되는 함수
  updateStatusWithReason: async (id, status, reason) => {
    return await Plant.update(
      { 
        status: status,           // service에서 넘어온 'archived'가 들어감
        death_reason: reason      // 사망 이유 저장
      }, 
      { where: { id } }
    );
  },

  permanentDelete: async (id) => {
    // force: true를 설정해야 DB에서 완전히 삭제
    return await Plant.destroy({ where: { id }, force: true });
  },

  getRandomTip: async () => {
    return await SpeciesInfo.findOne({
      order: sequelize.random(), 
      attributes: ['mini_tip']   
    });
  }
};