const { EnvironmentLog, Notification, Sequelize } = require('../index');
const { Op } = Sequelize;

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
    },

    // [추가] 최근 7일간의 일별 평균 데이터 조회
    getWeeklyStats: async (plantId) => {
        return await EnvironmentLog.findAll({
            where: {
                plant_id: plantId,
                created_at: { [Op.gte]: Sequelize.literal('DATE_SUB(CURDATE(), INTERVAL 6 DAY)') }
            },
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
                [Sequelize.fn('AVG', Sequelize.col('moisture_level')), 'avg_moisture'],
                [Sequelize.fn('AVG', Sequelize.col('temperature')), 'avg_temp'],
                [Sequelize.fn('AVG', Sequelize.col('light_level')), 'avg_light']
            ],
            group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
            order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']],
            raw: true
        });
    },

    // [추가] 최근 7일간 발생한 에러 알림 목록 조회
    getWeeklyErrors: async (plantId) => {
        return await Notification.findAll({
            where: {
                plant_id: plantId,
                type: 'ERROR',
                created_at: { [Op.gte]: Sequelize.literal('DATE_SUB(CURDATE(), INTERVAL 6 DAY)') }
            },
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
                'message'
            ],
            order: [['created_at', 'ASC']],
            raw: true
        });
    }
};