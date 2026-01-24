const repository = require('./repository');

module.exports = {
    // 하드웨어로부터 받은 환경 데이터 기록
    recordEnvironment: async (envData) => {
        // 여기에 '특정 수치 이상일 때 경고' 같은 로직을 추가 가능
        return await repository.save(envData);
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