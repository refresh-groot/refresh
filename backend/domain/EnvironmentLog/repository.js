const { EnvironmentLog } = require('../index');

module.exports = {
    // 실시간 센서 데이터 저장 (10분 주기 또는 변동 시)
    save: async (data) => {
        return await EnvironmentLog.create(data);
    },

    // 특정 식물의 환경 변화 기록 전체 조회 (그래프용)
    findAllByPlantId: async (plantId) => {
        return await EnvironmentLog.findAll({
            where: { plant_id: plantId },
            order: [['created_at', 'DESC']] // 최신 데이터부터
        });
    },

    // 가장 최근의 센서값 하나만 조회 (현재 상태 표시용)
    findLatest: async (plantId) => {
        return await EnvironmentLog.findOne({
            where: { plant_id: plantId },
            order: [['created_at', 'DESC']]
        });
    }
};