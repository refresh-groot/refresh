const repository = require('./repository');

module.exports = {
    // 식물별 알림 리스트 가져오기
    getNotifications: async (plantId) => {
        return await repository.findAllByPlantId(plantId);
    },

    // 특정 알림 읽음 표시
    markAsRead: async (id) => {
        return await repository.updateReadStatus(id);
    }
};