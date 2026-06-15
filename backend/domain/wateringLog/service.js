const repository = require('./repository');
const { Notification } = require('../index');

module.exports = {
    recordWatering: async (logData) => {
        // ⭐ [더블 로깅 방어막 추가] 
        // moisture_level 값이 null, undefined이거나, 너무 터무니없는 값(예: 0)일 경우 DB 저장을 막습니다.
        if (logData.moisture_level == null || logData.moisture_level === undefined || logData.moisture_level <= 0) {
            console.log("⚠️ 센서값이 없는 급수 로그는 저장하지 않습니다. (더블 로깅 방어)");
            return null; // 여기서 함수를 끝내버려서 repository.save()가 실행되지 않게 함
        }

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