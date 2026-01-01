// backend/domain/plant/service.js
const { WateringLog } = require('../index'); //[추가] WateringLog 모델을 불러옵니다.
const repository = require('./repository');

module.exports = {
  // 사용자의 레벨(등급) 계산 로직
  calculateUserLevel: async (userId) => {
    // 1. 자동급수(is_auto=true)를 사용한 '유니크한 날짜' 수 카운트
    // 이제 위에서 WateringLog를 불러왔으므로 정상 작동합니다.
    const wateringDays = await WateringLog.count({
      distinct: true,
      col: 'logged_at', // 날짜 컬럼 기준
      where: {
        is_auto: true,
        // user_id가 WateringLog에 있다면 아래처럼 추가할 수 있습니다.
        // user_id: userId 
      }
    });

    // 2. 등급 기준 설정
    if (wateringDays >= 100) return '타잔';
    if (wateringDays >= 30) return '고수';
    if (wateringDays >= 7) return '중수';
    return '초보';
  },

  // 사용자의 활성 식물 목록을 가져오는 비즈니스 로직
  getUserActivePlants: async (userId) => {
    const plants = await repository.findAllActiveByUserId(userId);
    return plants;
  },

  // 식물 등록 로직
  addPlant: async (plantData) => {
    return await repository.create(plantData);
  },

  // 3단계 삭제 처리 로직
  handleDeletion: async (plantId, mode) => {
    if (mode === 'archive') {
      return await repository.updateStatus(plantId, 'archived');
    } else if (mode === 'permanent') {
      return await repository.permanentDelete(plantId);
    }
    throw new Error('잘못된 삭제 모드입니다.');
  }
};