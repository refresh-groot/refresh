const repository = require('./repository');
const { Notification } = require('../index');

module.exports = {
    // 하드웨어로부터 받은 환경 데이터 기록
    recordEnvironment: async (envData) => {
        // 1. 먼저 환경 데이터를 DB에 저장
        const savedLog = await repository.save(envData);
        const { plant_id, moisture_level, temperature, light_level } = savedLog;

        // --- [알림 로직 우선순위 배치] ---
        // 나중에 생성된 알림이 'created_at DESC' 정렬 시 가장 위에 뜨게됨
        // 따라서 가장 중요한 '수분' 알림을 맨 아래에 배치함

        // 1. 조도 알림 (ERROR)
        if (light_level !== null && light_level < 100) {
            await Notification.create({
                plant_id,
                type: 'ERROR',
                message: `일조량 부족 (조도: ${light_level})`,
                captured_value: `${light_level}`
            });
        }

        // 2. 온도 알림 (ERROR)
        if (temperature !== null) {
            if (temperature > 35) {
                await Notification.create({
                    plant_id,
                    type: 'ERROR',
                    message: `고온 위험 (현재: ${temperature.toFixed(1)}°C)`,
                    captured_value: `${temperature}`
                });
            } else if (temperature < 5) {
                await Notification.create({
                    plant_id,
                    type: 'ERROR',
                    message: `저온 위험 (현재: ${temperature.toFixed(1)}°C)`,
                    captured_value: `${temperature}`
                });
            }
        }

        // 3. 수분 알림 (ERROR - 가장 중요)
        if (moisture_level !== null && moisture_level < 30) {
            await Notification.create({
                plant_id,
                type: 'ERROR',
                message: `토양 건조 주의 (수분: ${moisture_level}%)`,
                captured_value: `${moisture_level}`
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