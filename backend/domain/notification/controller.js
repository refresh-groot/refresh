const service = require('./service');

module.exports = {
    // [GET] 특정 식물의 알림 목록 조회
    getNotifications: async (req, res) => {
        try {
            const { plantId } = req.params;
            const notifications = await service.getNotifications(plantId);
            return res.status(200).json(notifications);
        } catch (error) {
            console.error("알림 조회 에러:", error);
            return res.status(500).json({ message: error.message });
        }
    },

    // [PATCH] 알림 읽음 처리
    readNotification: async (req, res) => {
        try {
            const { id } = req.params;
            await service.markAsRead(id);
            return res.status(200).json({ message: '알림을 확인했습니다.' });
        } catch (error) {
            console.error("알림 읽음 처리 에러:", error);
            return res.status(500).json({ message: error.message });
        }
    }
};