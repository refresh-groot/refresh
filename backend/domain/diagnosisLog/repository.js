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
                session_id: payload.session_id,
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

    // 4. (구) 개별 로그 이름 변경
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

    // 5. (구) 개별 로그 삭제
    deleteById: async (logId) => {
        try {
            const result = await DiagnosisLog.destroy({
                where: { id: logId }
            });
            return result;
        } catch (error) {
            throw error;
        }
    },

    // ▼▼▼ [추가된 함수] 세션(채팅방) 기능 ▼▼▼

    // 6. 세션(채팅방) 이름 변경 - 해당 세션의 모든 로그 제목 변경
    updateSessionTitle: async (sessionId, newTitle) => {
        try {
            const result = await DiagnosisLog.update(
                { title: newTitle }, 
                { where: { session_id: sessionId } }
            );
            return result;
        } catch (error) {
            throw error;
        }
    },

    // 7. 세션(채팅방) 삭제 - 해당 세션의 모든 로그 삭제
    deleteSession: async (sessionId) => {
        try {
            if (sessionId === 'no_session' || sessionId === 'null') {
                return await DiagnosisLog.destroy({
                    where: { session_id: null } // NULL인 데이터들 삭제
                });
            }

            // 일반적인 방 번호가 있는 경우
            const result = await DiagnosisLog.destroy({
                where: { session_id: sessionId }
            });
            return result;
        } catch (error) {
            throw error;
        }
    }
};