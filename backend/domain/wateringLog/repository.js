// backend/domain/wateringLog/repository.js
const { WateringLog } = require('../index');

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

    // [추가] 특정 ID의 이력을 찾아 업데이트 (사진 등록 시 사용)
    update: async (id, updateData) => {
        // 먼저 해당 데이터를 업데이트
        await WateringLog.update(updateData, {
            where: { id: id }
        });
        
        // 업데이트된 데이터를 다시 조회해서 반환
        return await WateringLog.findByPk(id);
    },

    // 3. (데이터 분석용) 특정 식물의 가장 최근 급수 기록 하나만 가져오기
    findLatestOne: async (plantId) => {
        return await WateringLog.findOne({
            where: { plant_id: plantId },
            order: [['watering_date', 'DESC']]
        });
    }
};