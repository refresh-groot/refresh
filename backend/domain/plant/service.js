// backend/domain/plant/service.js
const repository = require('./repository');

module.exports = {

  // getUserActivePlants, addPlant, handleDeletion 함수는 기존과 동일하게 유지
  getUserActivePlants: async (userId) => {
    return await repository.findAllActiveByUserId(userId);
  },
  addPlant: async (plantData) => {
    return await repository.create(plantData);
  },
  handleDeletion: async (plantId, mode) => {
    if (mode === 'archive') {
      return await repository.updateStatus(plantId, 'archived');
    } else if (mode === 'permanent') {
      return await repository.permanentDelete(plantId);
    }
    throw new Error('잘못된 삭제 모드입니다.');
  }
};