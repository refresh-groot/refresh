const repository = require('./repository');
// ▼ [추가] 세션 일괄 처리를 위해 Sequelize 모델을 직접 불러옵니다.
const DiagnosisLog = require('./DiagnosisLog'); 
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// AI 서버 통신 함수 
const requestAIAnalysis = async (file, question) => {
    try {
        const formData = new FormData();
        if (file) {
            formData.append('image', fs.createReadStream(file.path));
        }
        if (question) {
            formData.append('question', question);
        }

        // AI 서버 주소
        const pythonServerUrl = 'https://ys1235-smartplant.hf.space/predict';
        
        console.log("🚀 AI 서버로 요청 보냄...");
        const response = await axios.post(pythonServerUrl, formData, {
            headers: { ...formData.getHeaders() },
        });

        console.log("✅ AI 응답 도착:", response.data);
        return response.data;

    } catch (error) {
        console.error('❌ AI 연결 실패:', error.message);
        // 실패해도 서버가 죽으면 안 되니 기본값 반환
        return { 
            result: '통신 오류', 
            recommendation: 'AI 서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.', 
            confidence: 0 
        };
    }
};

module.exports = {
    // 1. 진단방 생성 (AI 분석 + DB 저장)
    addDiagnosisLog: async ({ plantId, file, question, title, sessionId }) => {
        // (1) 이미지 경로 문자열 만들기
        const imageUrl = file ? `/uploads/${file.filename}` : null;
        
        // (2) AI에게 물어보기 (파일이 있거나 질문이 있을 때만)
        let aiResponse = { result: '정상', recommendation: '', confidence: 0 };
        if (file || question) {
             aiResponse = await requestAIAnalysis(file, question);
        }

        const finalResult = aiResponse.result || '상담';

        // (3) 결과 + 제목 + ★세션ID 합쳐서 DB에 저장
        const newLog = await repository.create({
            plant_id: plantId,
            image_url: imageUrl,
            question: question,
            result: finalResult,
            recommendation: aiResponse.recommendation || '',
            confidence: aiResponse.confidence || 0.0,
            title: title,
            session_id: sessionId // DB에 저장!
        });

        return newLog;
    },

    // 2. 목록 조회
    getDiagnosisLogs: async (plantId) => {
        return await repository.findAllByPlantId(plantId);
    },

    // 3. (구) 개별 로그 이름 변경
    updateDiagnosisTitle: async (logId, title) => {
        return await repository.updateTitle(logId, title);
    },

    // 4. (구) 개별 로그 삭제
    deleteDiagnosisLog: async (logId) => {
        const log = await repository.findById(logId);
        if (!log) throw new Error('NOT_FOUND');

        if (log.image_url) {
            const fileName = path.basename(log.image_url);
            const filePath = path.join(__dirname, '../../public/uploads', fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        return await repository.deleteById(logId);
    },

    // ▼▼▼ [새로 추가된 함수] 세션(채팅방) 기능 ▼▼▼

    // 5. 세션 이름 변경 (채팅방 이름 바꾸기)
    updateSessionTitle: async (sessionId, title) => {
        // 해당 session_id를 가진 모든 기록의 title을 한 번에 변경합니다.
        return await DiagnosisLog.update(
            { title: title }, 
            { where: { session_id: sessionId } }
        );
    },

    // 6. 세션 삭제 (채팅방 나가기)
    deleteSession: async (sessionId) => {
        // (심화) 이미지를 깔끔하게 지우려면 먼저 조회를 해야 하지만, 
        // 일단 DB 데이터부터 삭제하여 기능을 작동시키는 데 집중합니다.
        return await DiagnosisLog.destroy(
            { where: { session_id: sessionId } }
        );
    }
};