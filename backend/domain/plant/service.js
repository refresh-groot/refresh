const repository = require('./repository');

module.exports = {
    // 사용자의 레벨(등급) 계산 로직
  calculateUserLevel: async (userId) => {
    // 1. 자동급수(is_auto=true)를 사용한 '유니크한 날짜' 수 카운트
    const wateringDays = await WateringLog.count({
      distinct: true,
      col: 'logged_at', // 날짜 컬럼 기준
      where: {
        is_auto: true,
        // user_id가 WateringLog에 없다면 Plant와 JOIN이 필요할 수 있습니다.
      }
    });

    // 2. 등급 기준 설정 (사용자님 기획안 반영)
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
    // 여기서 나중에 '식물 종에 따른 기본 팁' 등을 추가 가공할 수 있음
    return await repository.create(plantData);
  },

  // 3단계 삭제 처리 로직
  handleDeletion: async (plantId, mode) => {
    if (mode === 'archive') {
      // 1) 기록보관함 모드: 상태값만 변경
      return await repository.updateStatus(plantId, 'archived');
    } else if (mode === 'permanent') {
      // 2) 완전삭제 모드: DB에서 제거
      return await repository.permanentDelete(plantId);
    }
    // 'cancel'은 프론트에서 처리하므로 백엔드 로직 불필요
    throw new Error('잘못된 삭제 모드입니다.');
  }
};