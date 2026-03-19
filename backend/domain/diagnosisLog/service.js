const repository = require('./repository');
const DiagnosisLog = require('./DiagnosisLog'); 
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// AI 서버 통신 함수 
const requestAIAnalysis = async (file, question) => {
    try {
        // [방어 로직] 파일이나 질문 둘 중 하나는 있어야 통신
        if (!file && !question) {
            throw new Error('이미지 파일이나 질문 내용 중 하나는 필수입니다.');
        }

        const formData = new FormData();
        if (file) {
            formData.append('image', fs.createReadStream(file.path));
        }
        if (question) {
            formData.append('message', question);
        }

        const pythonServerUrl = 'https://ys1235-smartplant.hf.space/predict'.trim();
        
        console.log(`🚀 AI 서버(${pythonServerUrl})로 요청 보냄...`);
        const response = await axios.post(pythonServerUrl, formData, {
            headers: { ...formData.getHeaders() },
            timeout: 10000 // AI 서버 응답 지연 시 10초 타임아웃
        });

        console.log("✅ AI 응답 도착:", response.data);
        return response.data;

    } catch (error) {
        console.error('❌ AI 연결 실패:', error.message);
        
        if (error.response && error.response.data) {
            console.error('🚨 파이썬 서버의 진짜 에러 원인:', error.response.data);
        }

        return { 
            ui_status: '통신 오류', 
            ui_guide: 'AI 서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.', 
            ui_water_msg: '',
            confidence: 0
        };
    }
};

module.exports = {
    // 1. 진단방 생성 (AI 분석 + DB 저장)
    addDiagnosisLog: async ({ plantId, file, question, title, sessionId }) => {
        const imageUrl = file ? `/uploads/${file.filename}` : null;
        
        let aiResponse = {};
        if (file || question) {
             aiResponse = await requestAIAnalysis(file, question);
        }

        const finalResult = aiResponse.ui_status || '상담 완료';
        
        let finalRecommendation = aiResponse.ui_guide || '상세 진단 내용이 없습니다.';
        if (aiResponse.ui_water_msg) {
            finalRecommendation += `\n\n💧 물주기 팁: ${aiResponse.ui_water_msg}`;
        }

        // 🔥 [수정됨] AI 점수 스케일(10점 만점 vs 100점 만점) 유연하게 대처
        let finalConfidence = parseFloat(aiResponse.confidence);
        
        if (isNaN(finalConfidence)) {
            finalConfidence = 0.85; // 기본값 85% (0.85로 저장)
        } else {
            // AI가 10점 만점 기준으로 보낼 경우 (예: 10 -> 1.0(100%), 9 -> 0.9(90%))
            if (finalConfidence > 1 && finalConfidence <= 10) {
                finalConfidence = finalConfidence / 10.0;
            } 
            // AI가 100점 만점 기준으로 보낼 경우 (예: 85 -> 0.85(85%))
            else if (finalConfidence > 10) {
                finalConfidence = finalConfidence / 100.0;
            }
            
            // 마지막으로 안전하게 0.0 ~ 1.0 사이로 철벽 방어! (1.0 = 100%)
            finalConfidence = Math.min(1.0, Math.max(0.0, finalConfidence));
        }

        const newLog = await repository.create({
            plant_id: plantId,
            image_url: imageUrl,
            question: question,
            result: finalResult,             
            recommendation: finalRecommendation, 
            confidence: finalConfidence,     
            title: title,
            session_id: sessionId 
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
            try {
                const fileName = path.basename(log.image_url);
                const filePath = path.join(__dirname, '../../public/uploads', fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error("파일 삭제 에러:", err.message);
            }
        }
        return await repository.deleteById(logId);
    },

    // 5. 세션 이름 변경
    updateSessionTitle: async (sessionId, title) => {
        return await DiagnosisLog.update(
            { title: title }, 
            { where: { session_id: sessionId } }
        );
    },

    // 6. 세션 삭제
    deleteSession: async (sessionId) => {
        // [수정됨] 세션 삭제 시 해당 세션에 묶인 이미지도 함께 삭제 (용량 확보)
        try {
            const logsInSession = await DiagnosisLog.findAll({
                where: { session_id: sessionId }
            });

            logsInSession.forEach(log => {
                if (log.image_url) {
                    try {
                        const fileName = path.basename(log.image_url);
                        const filePath = path.join(__dirname, '../../public/uploads', fileName);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (fileErr) {
                        console.error(`세션 삭제 중 이미지 지우기 실패:`, fileErr.message);
                    }
                }
            });
            
            return await DiagnosisLog.destroy(
                { where: { session_id: sessionId } }
            );
        } catch (error) {
            console.error('세션 삭제 오류:', error.message);
            throw error;
        }
    }
};