// backend/domain/wateringLog/service.js
const repository = require('./repository');
const { Notification } = require('../index'); // [추가] Notification 모델 임포트

module.exports = {
    // 급수 기록 추가 로직
    recordWatering: async (logData) => {
        // 1. 급수 기록을 DB에 저장
        const savedLog = await repository.save(logData);

        // 2. [알림 로직] 급수 완료 알림 생성
        // 자동(true)/수동(false) 여부에 따라 메시지 문구를 다르게 설정 가능
        const mode = savedLog.is_auto ? '자동' : '수동';
        
        await Notification.create({
            plant_id: savedLog.plant_id,
            type: 'SUCCESS',
            message: `${mode} 급수가 완료되었습니다.`,
            captured_value: `${savedLog.duration_sec}초 동안 급수됨`
        });

        return savedLog;
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