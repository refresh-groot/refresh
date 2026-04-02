const repository = require('./repository');
const { Notification } = require('../index'); // [추가] Notification 모델 임포트

module.exports = {
    // 하드웨어로부터 받은 환경 데이터 기록
    recordEnvironment: async (envData) => {
        // 1. 먼저 환경 데이터를 DB에 저장
        const savedLog = await repository.save(envData);

        // 2. [알림 로직] 수분값(moisture_level)이 30 미만이면 건조 알림 생성
        // (0~100 범위: 숫자가 낮을수록 건조하므로 30 미만을 '매우 건조'로 판단)
        if (savedLog.moisture_level !== null && savedLog.moisture_level < 30) {
            await Notification.create({
                plant_id: savedLog.plant_id,
                type: 'ERROR',
                message: '토양이 매우 건조합니다! 물통을 확인하거나 물을 주세요.',
                captured_value: `수분: ${savedLog.moisture_level}%`
            });
        }

        return savedLog;
    },

    // 특정 식물의 환경 이력 가져오기
    getEnvHistory: async (plantId) => {
        return await repository.findAllByPlantId(plantId);
    },

    // 현재 식물의 가장 최신 상태 정보 가져오기
    getCurrentStatus: async (plantId) => {
        return await repository.findLatest(plantId);
    }
};