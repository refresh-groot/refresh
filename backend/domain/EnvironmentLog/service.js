const repository = require('./repository');
const { Notification, Plant, SpeciesInfo } = require('../index');

module.exports = {
    // 하드웨어로부터 받은 환경 데이터 기록 (기존 유지)
    recordEnvironment: async (envData) => {
        const savedLog = await repository.save(envData);
        const { plant_id, moisture_level, temperature, light_level } = savedLog;

        const plant = await Plant.findOne({
            where: { id: plant_id },
            include: [{ model: SpeciesInfo, as: 'guide' }]
        });

        const spec = plant?.guide;
        const limits = {
            min_moisture: spec?.min_moisture ?? 30,
            max_temp: spec?.max_temp ?? 35.0,
            min_temp: spec?.min_temp ?? 5.0,
            min_light: spec?.min_light ?? 100
        };

        if (light_level !== null && light_level < limits.min_light) {
            await Notification.create({
                plant_id, type: 'ERROR',
                message: `일조량 부족 (조도: ${light_level})`,
                captured_value: `${light_level}`
            });
        }

        if (temperature !== null) {
            if (temperature > limits.max_temp) {
                await Notification.create({
                    plant_id, type: 'ERROR',
                    message: `고온 위험 (현재: ${temperature.toFixed(1)}°C)`,
                    captured_value: `${temperature}`
                });
            } else if (temperature < limits.min_temp) {
                await Notification.create({
                    plant_id, type: 'ERROR',
                    message: `저온 위험 (현재: ${temperature.toFixed(1)}°C)`,
                    captured_value: `${temperature}`
                });
            }
        }

        if (moisture_level !== null && moisture_level < limits.min_moisture) {
            await Notification.create({
                plant_id, type: 'ERROR',
                message: `토양 건조 주의 (수분: ${moisture_level}%)`,
                captured_value: `${moisture_level}`
            });
        }

        return savedLog;
    },

    // [완결] 주간 차트 데이터 (프론트엔드 코드에 100% 매칭)
    getWeeklyChartData: async (plantId) => {
        const stats = await repository.getWeeklyStats(plantId);
        const errorLogs = await repository.getWeeklyErrors(plantId);
        
        const plant = await Plant.findOne({
            where: { id: plantId },
            include: [{ model: SpeciesInfo, as: 'guide' }]
        });

        const statMap = {};
        stats.forEach(s => { statMap[String(s.date)] = s; });

        const errorMap = {};
        errorLogs.forEach(err => {
            const dStr = String(err.date);
            if (!errorMap[dStr]) errorMap[dStr] = [];
            errorMap[dStr].push(err.message);
        });

        const labels = []; // [변경] 변수명을 dateLabels에서 labels로 수정
        const moistureData = [];
        const tempData = [];
        const lightData = [];
        const dailyErrors = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;

            // [변경] 기존 코드의 날짜 형식(M/D)으로 맞춤
            labels.push(`${d.getMonth() + 1}/${d.getDate()}`); 

            const dayData = statMap[dateKey];
            moistureData.push(dayData ? Math.round(dayData.avg_moisture || 0) : 0);
            tempData.push(dayData && dayData.avg_temp ? parseFloat(Number(dayData.avg_temp).toFixed(1)) : 0);
            lightData.push(dayData ? Math.round(dayData.avg_light || 0) : 0);
            finalErrors = (errorMap[dateKey] || []);
            dailyErrors.push(finalErrors);
        }

        return {
            labels, // [변경]labels로 반환
            moistureData,
            tempData,
            lightData,
            dailyErrors,
            thresholds: {
                moisture: plant?.guide?.min_moisture ?? 30,
                temp: plant?.guide?.max_temp ?? 35,
                light: plant?.guide?.min_light ?? 100
            }
        };
    },

    getEnvHistory: async (plantId) => {
        return await repository.findAllByPlantId(plantId);
    },

    getCurrentStatus: async (plantId) => {
        return await repository.findLatest(plantId);
    }
};