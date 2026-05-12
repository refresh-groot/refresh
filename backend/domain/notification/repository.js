const { Notification } = require('../index');

module.exports = {
    // 모든 알림 기록 조회 (알림창용)
    findAllByPlantId: async (plantId) => {
        return await Notification.findAll({
            where: { plant_id: plantId },
            order: [['created_at', 'ASC']] // 최신 알림부터
        });
    },

    // 알림 읽음 처리 (확인 시 상태 변경)
    updateReadStatus: async (id) => {
        return await Notification.update(
            { is_read: true },
            { where: { id: id } }
        );
    }
};