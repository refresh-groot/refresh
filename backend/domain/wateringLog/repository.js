// backend/domain/wateringLog/repository.js
const { WateringLog } = require('../../models'); // 모델 관리 위치에 맞게 수정

module.exports = {
    // 1. 새로운 급수 이력 생성
    save: async (data) => {
        return await WateringLog.create(data);
    },

    // 2. 특정 식물의 모든 급수 이력 조회 (최신순)
    findAllByPlantId: async (plantId) => {
        return await WateringLog.findAll({
            where: { plant_id: plantId },
            order: [['watering_date', 'DESC']] // 최신 기록이 위로 오게 정렬
        });
    },

    // 3. (데이터 분석용) 특정 식물의 가장 최근 급수 기록 하나만 가져오기
    findLatestOne: async (plantId) => {
        return await WateringLog.findOne({
            where: { plant_id: plantId },
            order: [['watering_date', 'DESC']]
        });
    }
};