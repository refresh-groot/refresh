const repository = require('./repository');
const { Notification, Plant, SpeciesInfo } = require('../index');

module.exports = {
    // 하드웨어로부터 받은 환경 데이터 기록
    recordEnvironment: async (envData) => {
        // 1. 먼저 환경 데이터를 DB에 저장
        const savedLog = await repository.save(envData);
        const { plant_id, moisture_level, temperature, light_level } = savedLog;

        // 2. [지능형 로직] 식물 정보와 종별 기준값 가져오기
        const plant = await Plant.findOne({
            where: { id: plant_id },
            include: [{ 
                model: SpeciesInfo, 
                as: 'guide' 
            }]
        });

        // 3. 기준값 설정 (DB에 값이 없으면 기존에 쓰던 기본값 사용)
        const spec = plant?.guide;
        const limits = {
            min_moisture: spec?.min_moisture ?? 30,
            max_temp: spec?.max_temp ?? 35.0,
            min_temp: spec?.min_temp ?? 5.0,
            min_light: spec?.min_light ?? 100
        };

        // --- [알림 로직 우선순위 배치] ---
        // 나중에 생성된 알림이 최신순 상단에 뜨므로 '수분'을 맨 아래 배치

        // 1. 조도 알림 (ERROR)
        if (light_level !== null && light_level < limits.min_light) {
            await Notification.create({
                plant_id,
                type: 'ERROR',
                message: `일조량 부족 (조도: ${light_level})`,
                captured_value: `${light_level}`
            });
        }

        // 2. 온도 알림 (ERROR)
        if (temperature !== null) {
            if (temperature > limits.max_temp) {
                await Notification.create({
                    plant_id,
                    type: 'ERROR',
                    message: `고온 위험 (현재: ${temperature.toFixed(1)}°C)`,
                    captured_value: `${temperature}`
                });
            } else if (temperature < limits.min_temp) {
                await Notification.create({
                    plant_id,
                    type: 'ERROR',
                    message: `저온 위험 (현재: ${temperature.toFixed(1)}°C)`,
                    captured_value: `${temperature}`
                });
            }
        }

        // 3. 수분 알림 (ERROR - 가장 중요)
        if (moisture_level !== null && moisture_level < limits.min_moisture) {
            await Notification.create({
                plant_id,
                type: 'ERROR',
                message: `토양 건조 주의 (수분: ${moisture_level}%)`,
                captured_value: `${moisture_level}`
            });
        }

        return savedLog;
    },

    // [신규 추가] 주간 차트용 통계 데이터 및 기준값 가져오기
    getWeeklyChartData: async (plantId) => {
        // 1. 레포지토리에서 최근 7일치 일별 평균 데이터 조회
        const stats = await repository.getWeeklyStats(plantId);
        const errorLogs = await repository.getWeeklyErrors(plantId);
        
        // 2. 해당 식물의 기준값(차트의 빨간 점선) 조회
        const plant = await Plant.findOne({
            where: { id: plantId },
            include: [{ model: SpeciesInfo, as: 'guide' }]
        });

        // 날짜별로 에러 메시지 그룹화
        const errorMap = {};
        errorLogs.forEach(err => {
            if (!errorMap[err.date]) errorMap[err.date] = [];
            errorMap[err.date].push(err.message);
        });

        // 3. 프론트엔드의 labels와 dataList에 바로 사용할 수 있도록 가공하여 반환
        // [수정] s.avg_temp가 null인 경우를 대비해 예외 처리 추가
        return {
            dateLabels: stats.map(s => s.date),
            moistureData: stats.map(s => Math.round(s.avg_moisture || 0)),
            tempData: stats.map(s => s.avg_temp ? parseFloat(Number(s.avg_temp).toFixed(1)) : 0),
            lightData: stats.map(s => Math.round(s.avg_light || 0)),
            dailyErrors: stats.map(s => errorMap[s.date] || []),
            thresholds: {
                moisture: plant?.guide?.min_moisture ?? 30,
                temp: plant?.guide?.max_temp ?? 35,
                light: plant?.guide?.min_light ?? 100
            }
        };
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