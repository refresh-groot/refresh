const repository = require('./repository');
const { Notification } = require('../index');

module.exports = {
    recordWatering: async (logData) => {
        const savedLog = await repository.save(logData);

        // --- [시간 포맷팅 로직] ---
        // 현재 시간을 '오전/오후 09:12' 형식으로 변환
        const now = new Date();
        const timeString = now.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const mode = savedLog.is_auto ? '자동' : '수동';
        
        // 메시지 예시: "오전 09:12 자동 급수 완료 (12초)"
        await Notification.create({
            plant_id: savedLog.plant_id,
            type: 'SUCCESS',
            message: `${timeString} ${mode} 급수 완료 (${savedLog.duration_sec}초)`,
            captured_value: `${savedLog.duration_sec}`
        });

        return savedLog;
    },

    getLogs: async (plantId) => {
        return await repository.findAllByPlantId(plantId);
    },
    
    updateImage: async (id, imageUrl) => {
        return await repository.update(id, { image_url: imageUrl });
    }
};