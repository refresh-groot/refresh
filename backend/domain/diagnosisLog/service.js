const repository = require('./repository');
// ▼ [추가] 세션 일괄 처리를 위해 Sequelize 모델을 직접 불러옵니다.
const DiagnosisLog = require('./DiagnosisLog'); 
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// AI 서버 통신 함수 
const requestAIAnalysis = async (files, question) => {
    try {
        const formData = new FormData();
        if (files && files.length > 0) {
            files.forEach((file) => {
            formData.append('image', fs.createReadStream(file.path));
            });
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
    addDiagnosisLog: async ({ plantId, files, question, title, sessionId }) => {
    const imageUrls = files && files.length > 0 
        ? files.map(f => `/uploads/${f.filename}`).join(',') 
        : null;
    
    const aiResponse = await requestAIAnalysis(files, question);
    const finalResult = aiResponse.result || '상담';

    const newLog = await repository.create({
        plant_id: plantId,
        image_url: imageUrls,
        question: question,
        result: finalResult,
        recommendation: aiResponse.recommendation || '',
        confidence: aiResponse.confidence || 0.0,
        title: title,
        session_id: sessionId
    });

    // [중요] image_url을 배열로 변환해서 응답
    return {
        ...newLog.toJSON(),
        image_url: imageUrls ? imageUrls.split(',') : []
    };
},

    // 2. 목록 조회
    getDiagnosisLogs: async (plantId) => {
    const logs = await repository.findAllByPlantId(plantId);
    
    // [추가] 로그 데이터 변환
    const formattedLogs = logs.map(log => {
        // Sequelize 모델을 plain object로 변환
        const plainLog = log.toJSON ? log.toJSON() : { ...log };
        
        // image_url을 배열로 변환
        if (plainLog.image_url) {
            plainLog.image_url = plainLog.image_url
                .split(',')
                .map(url => url.trim())
                .filter(url => url.length > 0);
        } else {
            plainLog.image_url = [];
        }
        
        return plainLog;
    });
    
    console.log('📋 전송할 로그 데이터:', formattedLogs[0]); // 디버깅용
    return formattedLogs;
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
            // 쉼표로 구분된 경로들을 배열로 다시 나눔
            const urlList = log.image_url.split(',');
            urlList.forEach(url => {
                const fileName = path.basename(url);
                const filePath = path.join(__dirname, '../../public/uploads', fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath); // 실제 파일 삭제
                }
            });
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
        const logs = await DiagnosisLog.findAll({ where: { session_id: sessionId } });
        
        logs.forEach(log => {
            if (log.image_url) {
                log.image_url.split(',').forEach(url => {
                    const fileName = path.basename(url);
                    const filePath = path.join(__dirname, '../../public/uploads', fileName);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                });
            }
        });

        return await DiagnosisLog.destroy({ where: { session_id: sessionId } });
    }
};