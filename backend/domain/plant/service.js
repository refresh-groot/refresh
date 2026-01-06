// backend/domain/plant/service.js
const repository = require('./repository');

module.exports = {
  // 1. 특정 유저의 활성 식물 리스트 가져오기
  getUserActivePlants: async (userId) => {
    return await repository.findAllActiveByUserId(userId);
  },

  // 2. 새로운 식물 등록
  addPlant: async (plantData) => {
    return await repository.create(plantData);
  },

  // 3. 식물 삭제 처리 (기존 기능 유지)
  handleDeletion: async (plantId, mode) => {
    if (mode === 'archive') {
      // 일반적인 보관 처리
      return await repository.updateStatus(plantId, 'archived');
    } else if (mode === 'permanent') {
      // DB에서 물리적으로 삭제 (쓰레기통 아이콘)
      return await repository.permanentDelete(plantId);
    }
    throw new Error('잘못된 삭제 모드입니다.');
  },

  // 4. [새로 추가] 사망 이유 기록 및 보관함 이동 (연필 아이콘 대응)
  archiveWithReason: async (plantId, reason) => {
    // repository에 새로 추가한 updateStatusWithReason 함수를 호출합니다.
    return await repository.updateStatusWithReason(plantId, 'archived', reason);
  }
};