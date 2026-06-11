const repository = require('./repository');
const { Plant, DiagnosisLog } = require('../index');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// AI 서버 통신 함수 
const requestAIAnalysis = async (file, question ,plantSpecies, sensorData) => {
    try {
        // [방어 로직] 파일이나 질문 둘 중 하나는 있어야 통신
        if (!file && !question) {
            throw new Error('이미지 파일이나 질문 내용 중 하나는 필수입니다.');
        }

        const formData = new FormData();
        
        // 단일 파일일 경우와 배열일 경우를 모두 안전하게 처리
        if (file) {
            const files = Array.isArray(file) ? file : [file];
            files.forEach((f) => {
                formData.append('image', fs.createReadStream(f.path));
            });
        }
        
        if (question) {
            formData.append('message', question);
        }

        if (plantSpecies) formData.append('plant_species', plantSpecies);
        if (plantSpecies) formData.append('plant_species', plantSpecies);
        // 🚨 form-data 숫자 소실 버그 우회를 위해 문자열 상태 그대로 포장하여 안전하게 전송
        if (sensorData) {
            const sensorString = typeof sensorData === 'string' ? sensorData : JSON.stringify(sensorData);
            formData.append('sensor_data', sensorString);
            console.log("📦 [Node -> Python] sensor_data 패킹 완료:", sensorString);
        }

        const pythonServerUrl = 'https://ys1235-smartplant.hf.space/predict'.trim();
        
        console.log(`🚀 AI 서버(${pythonServerUrl})로 요청 보냄...`);
        const response = await axios.post(pythonServerUrl, formData, {
            headers: { ...formData.getHeaders() },
            timeout: 30000 // AI 서버 응답 지연 시 30초 타임아웃
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
    addDiagnosisLog: async ({ plantId, files, question, title, sessionId, sensorData }) => {
        // [수정] 여러 장의 파일(files) 경로를 콤마(,)로 합쳐서 저장하도록 변경
        const imageUrl = (files && files.length > 0) 
            ? files.map(f => `/uploads/${f.filename}`).join(',') 
            : null;

        const plantInfo = await Plant.findByPk(plantId);                           //추가 DB에서 가져오기
        const plantSpecies = plantInfo ? plantInfo.species : '알 수 없는 식물';    //추가

        let aiResponse = {};
        // [수정] file 대신 files 배열 존재 여부 확인
        if ((files && files.length > 0) || question) {
             // [수정] AI 분석 함수로 파일 배열 전달
             aiResponse = await requestAIAnalysis(files, question, plantSpecies, sensorData);
        }

        const finalResult = aiResponse.ui_status || '상담 완료';
        
        let finalRecommendation = aiResponse.ui_guide || '상세 진단 내용이 없습니다.';
        if (aiResponse.ui_water_msg) {
            finalRecommendation += `\n\n💧 물주기 팁: ${aiResponse.ui_water_msg}`;
        }

        // AI 점수 스케일(10점 만점 vs 100점 만점) 
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
            
            // 0.0 ~ 1.0 사이 (1.0 = 100%)
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
            // [수정] 여러 장의 이미지 삭제 대응
            const imageUrls = log.image_url.split(',');
            imageUrls.forEach(url => {
                try {
                    const fileName = path.basename(url.trim());
                    const filePath = path.join(__dirname, '../../public/uploads', fileName);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (err) {
                    console.error("파일 삭제 에러:", err.message);
                }
            });
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
        // 세션 삭제 시 해당 세션에 묶인 이미지도 함께 삭제 (용량 확보)
        try {
            const logsInSession = await DiagnosisLog.findAll({
                where: { session_id: sessionId }
            });

            logsInSession.forEach(log => {
                if (log.image_url) {
                    // [수정] 여러 장의 이미지 삭제 대응
                    const imageUrls = log.image_url.split(',');
                    imageUrls.forEach(url => {
                        try {
                            const fileName = path.basename(url.trim());
                            const filePath = path.join(__dirname, '../../public/uploads', fileName);
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }
                        } catch (fileErr) {
                            console.error(`세션 삭제 중 이미지 지우기 실패:`, fileErr.message);
                        }
                    });
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