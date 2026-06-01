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

  // [수정] 휴지통 버튼(DELETE) 대응 로직
  handleDeletion: async (plantId, mode) => {
    // mode가 'permanent'이거나 따로 지정되지 않은 경우 영구 삭제 진행
    if (mode === 'permanent' || !mode) {
      return await repository.permanentDelete(plantId);
    } 
    // 그 외에 명시적으로 'archive'라고 올 때만 보관함 처리
    else if (mode === 'archive') {
      return await repository.updateStatus(plantId, 'archived');
    }
    throw new Error('잘못된 삭제 모드입니다.');
  },

  // [수정] 연필 버튼(PATCH) 대응 로직
  archiveWithReason: async (plantId, reason) => {
    // 상태값을 무조건 'archived'로 고정하여 전달
    return await repository.updateStatusWithReason(plantId, 'archived', reason);
  },

  // ▼▼▼ [추가] 기기 매핑 및 하이재킹 검증 로직 ▼▼▼
  mapDeviceToPlant: async (plantId, device_name) => {
    // 1. 이미 다른 식물(다른 ID)이 이 기기를 쓰고 있는지 확인
    const existingPlant = await repository.findByDeviceId(device_name);
    
    // 내 식물이 아닌 다른 식물이 기기를 이미 선점했다면 에러 발생
    if (existingPlant && existingPlant.id != plantId) {
      throw new Error('이미 다른 식물에 매핑된 기기입니다. 기존 매핑을 해제해주세요.');
    }
    
    // 2. 문제없으면 업데이트 진행
    await repository.updateDeviceName(plantId, device_name);
    return { plantId, device_name };
  }
  // ▲▲▲ [추가] ▲▲▲
};