const repository = require('./repository');
const { Notification } = require('../index');

module.exports = {
    recordEnvironment: async (envData) => {
        const savedLog = await repository.save(envData);
        const { plant_id, moisture_level, temperature, light_level } = savedLog;

        // --- [알림 로직 확장 및 다듬기] ---
        
        // 1. 수분 알림 (간결하게 합침)
        if (moisture_level !== null && moisture_level < 30) {
            await Notification.create({
                plant_id,
                type: 'ERROR',
                message: `토양 건조 주의 (수분: ${moisture_level}%)`,
                captured_value: `${moisture_level}`
            });
        }

        // 2. 온도 알림 (미리 구현)
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

        // 3. 조도 알림 (미리 구현)
        if (light_level !== null && light_level < 100) {
            await Notification.create({
                plant_id,
                type: 'INFO',
                message: `일조량 부족 (조도: ${light_level})`,
                captured_value: `${light_level}`
            });
        }

        return savedLog;
    },

    getEnvHistory: async (plantId) => {
        return await repository.findAllByPlantId(plantId);
    },

    getCurrentStatus: async (plantId) => {
        return await repository.findLatest(plantId);
    }
};