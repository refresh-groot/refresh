// backend/domain/wateringLog/service.js
const repository = require('./repository');

module.exports = {
    // 급수 기록 추가 로직
    recordWatering: async (logData) => {
        // 데이터 검증이나 추가 가공이 필요하면 여기서 수행
        return await repository.save(logData);
    },

    // 특정 식물의 급수 히스토리 가져오기
    getLogs: async (plantId) => {
        return await repository.findAllByPlantId(plantId);
    },
    // 식물 사진 추가
    updateImage: async (id, imageUrl) => {
    return await repository.update(id, { image_url: imageUrl });
}
};