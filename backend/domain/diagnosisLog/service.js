const repository = require('./repository');
const { Plant, DiagnosisLog } = require('../index');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// AI 서버가 일시적으로 응답하지 않을 때 센서값으로 최소한의 관리 안내를 제공한다.
// 사진 병해 분석을 대신하지 않으므로 결과 문구에서 센서 기반 안내임을 분명히 표시한다.
const buildSensorFallback = (sensorData) => {
    let sensor = {};

    try {
        sensor = typeof sensorData === 'string' ? JSON.parse(sensorData) : (sensorData || {});
    } catch {
        sensor = {};
    }

    const soil = Number(sensor.soil);
    const temp = Number(sensor.temp);
    const hasSoil = Number.isFinite(soil);
    const hasTemp = Number.isFinite(temp);
    const guides = [];
    let waterTip = '';

    if (hasSoil && soil <= 30) {
        guides.push(`현재 토양 수분이 ${soil}%입니다. 흙 표면과 배수 상태를 확인한 뒤 소량 급수를 권장합니다.`);
        waterTip = '토양 수분이 30% 이하일 때 급수하도록 설정하면 관리에 도움이 됩니다.';
    } else if (hasSoil) {
        guides.push(`현재 토양 수분은 ${soil}%로 확인됩니다. 과습을 막기 위해 흙 표면이 마른 뒤 급수해주세요.`);
    }

    if (hasTemp && temp < 12) {
        guides.push(`현재 온도는 ${temp}°C입니다. 찬바람을 피하고 15°C 이상을 유지해주세요.`);
    } else if (hasTemp && temp > 30) {
        guides.push(`현재 온도는 ${temp}°C입니다. 직사광선을 줄이고 통풍이 되는 곳으로 옮겨주세요.`);
    }

    if (guides.length === 0) {
        guides.push('현재 연결된 센서값이 부족합니다. 기기 연결과 토양 상태를 직접 확인해주세요.');
    }

    guides.push('AI 서버가 복구되면 사진을 첨부해 잎 상태와 병해 가능성을 다시 진단해주세요.');

    return {
        ui_status: '센서 기반 관리 안내',
        ui_guide: guides.join('\n'),
        ui_water_msg: waterTip,
        confidence: 0.4
    };
};

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
        // 🚨 form-data 숫자 소실 버그 우회를 위해 문자열 상태 그대로 포장하여 안전하게 전송
        if (sensorData) {
            const sensorString = typeof sensorData === 'string' ? sensorData : JSON.stringify(sensorData);
            formData.append('sensor_data', sensorString);
        }

        const pythonServerUrl = process.env.AI_SERVER_URL;
        
        const response = await axios.post(pythonServerUrl, formData, {
            headers: { ...formData.getHeaders() },
            timeout: 30000 // AI 서버 응답 지연 시 30초 타임아웃
        });

        return response.data;

    } catch (error) {
        console.error('❌ AI 연결 실패:', error.message);
        
        if (error.response && error.response.data) {
            console.error('🚨 파이썬 서버의 진짜 에러 원인:', error.response.data);
        }

        return buildSensorFallback(sensorData);
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
        
        if (aiResponse.min_moisture !== undefined && aiResponse.water_duration_ms !== undefined) {
            try {
                // 상단에 이미 선언된 Plant 모델을 사용하여 UPDATE 쿼리 실행
                await Plant.update({
                    min_moisture: aiResponse.min_moisture,          // 수분 하한선 저장
                    water_duration_ms: aiResponse.water_duration_ms // 펌프 시간 저장
                }, {
                    where: { id: plantId } // 현재 진단받은 그 식물의 서랍장만 찾아서!
                });
            } catch (err) {
                console.error("❌ Plant DB 업데이트 실패:", err);
            }
        }

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
    updateSessionTitle: async (sessionId, title, plantId) => {
        const sessionKey = sessionId === 'no_session' || sessionId === 'null' ? null : sessionId;
        return await DiagnosisLog.update(
            { title: title }, 
            { where: { session_id: sessionKey, plant_id: plantId } }
        );
    },

    // 6. 세션 삭제
    deleteSession: async (sessionId, plantId) => {
        const sessionKey = sessionId === 'no_session' || sessionId === 'null' ? null : sessionId;
        // 세션 삭제 시 해당 세션에 묶인 이미지도 함께 삭제 (용량 확보)
        try {
            const logsInSession = await DiagnosisLog.findAll({
                where: { session_id: sessionKey, plant_id: plantId }
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
            
            return await DiagnosisLog.destroy({ where: { session_id: sessionKey, plant_id: plantId } });
        } catch (error) {
            console.error('세션 삭제 오류:', error.message);
            throw error;
        }
    }
};
