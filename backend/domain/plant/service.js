// backend/domain/plant/service.js
const { WateringLog } = require('../index'); 
const repository = require('./repository');

module.exports = {
  calculateUserLevel: async (userId) => {
    // 1. 자동급수(is_auto=1) 기록 중 유니크한 날짜 수 카운트
    const wateringDays = await WateringLog.count({
      distinct: true,
      // 기존: col: 'logged_at'
      // 수정: 실제 컬럼명
      col: 'watering_date', 
      where: {
        is_auto: true,
        // 참고: 현재 테이블에 user_id가 없으므로 
        // 전체 사용자의 자동급수 날짜를 카운트하게 됩니다.
      }
    });

    // 2. 등급 기준 적용
    if (wateringDays >= 100) return '타잔';
    if (wateringDays >= 30) return '고수';
    if (wateringDays >= 7) return '중수';
    return '초보';
  },
  
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