const { DiagnosisLog } = require('../index'); 

module.exports = {
    // 1. 진단방 생성
    create: async (payload) => {
        try {
            // 제목이 없으면 질문의 앞부분을 따서 제목으로 설정
            const title = payload.title || (payload.question ? payload.question.substring(0, 20) : '새로운 진단');
            
            const newLog = await DiagnosisLog.create({
                plant_id: payload.plant_id,
                image_url: payload.image_url,
                question: payload.question,
                result: payload.result,
                recommendation: payload.recommendation,
                confidence: payload.confidence,
                title: title,
                // diagnosis_date는 defaultValue가 있어서 생략 가능
            });
            
            return newLog; // 시퀄라이즈 객체 반환
        } catch (error) {
            throw error;
        }
    },

    // 2. 진단 목록 조회 (내림차순 정렬)
    findAllByPlantId: async (plantId) => {
        try {
            const logs = await DiagnosisLog.findAll({
                where: { plant_id: plantId },
                order: [['diagnosis_date', 'DESC']], // 최신 날짜가 위로 오게 정렬
                raw: true // 데이터만 깔끔하게 JSON으로 받기
            });
            return logs;
        } catch (error) {
            throw error;
        }
    },

    // 3. ID로 찾기 (삭제/수정 전 확인용)
    findById: async (logId) => {
        try {
            const log = await DiagnosisLog.findByPk(logId);
            return log;
        } catch (error) {
            throw error;
        }
    },

    // 4. 진단방 이름 변경
    updateTitle: async (logId, newTitle) => {
        try {
            const result = await DiagnosisLog.update(
                { title: newTitle }, // 바꿀 내용
                { where: { id: logId } } // 조건
            );
            return result;
        } catch (error) {
            throw error;
        }
    },

    // 5. 진단방 삭제
    deleteById: async (logId) => {
        try {
            const result = await DiagnosisLog.destroy({
                where: { id: logId }
            });
            return result;
        } catch (error) {
            throw error;
        }
    }
};