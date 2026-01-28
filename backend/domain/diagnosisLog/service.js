const repository = require('./repository');
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
    addDiagnosisLog: async ({ plantId, file, question, title }) => {
        // (1) 이미지 경로 문자열 만들기
        const imageUrl = file ? `/uploads/${file.filename}` : null;
        
        // (2) AI에게 물어보기
        const aiResponse = await requestAIAnalysis(file, question);

        // (3) 결과 + 제목 합쳐서 DB에 저장
        // result가 비어있으면 '분석 중' 처리
        const finalResult = aiResponse.result || '분석 중';

        const newLog = await repository.create({
            plant_id: plantId,
            image_url: imageUrl,
            question: question,
            result: finalResult,
            recommendation: aiResponse.recommendation || '내용 없음',
            confidence: aiResponse.confidence || 0.0,
            title: title 
        });

        return newLog;
    },

    // 2. 진단방 목록 조회
    getDiagnosisLogs: async (plantId) => {
        return await repository.findAllByPlantId(plantId);
    },

    // 3. 진단방 제목 변경
    updateDiagnosisTitle: async (logId, title) => {
        return await repository.updateTitle(logId, title);
    },

    // 4. 진단방 삭제 (파일 삭제 + DB 삭제 로직을 여기로 통합)
    deleteDiagnosisLog: async (logId) => {
        // (1) 파일 경로 확인을 위해 먼저 조회
        const log = await repository.findById(logId);
        if (!log) throw new Error('NOT_FOUND'); // 컨트롤러에게 에러 던짐

        // (2) 이미지 파일 있으면 삭제
        if (log.image_url) {
            const fileName = path.basename(log.image_url);
            // service.js 위치 기준: ../../public/uploads
            const filePath = path.join(__dirname, '../../public/uploads', fileName);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ 파일 삭제 완료: ${filePath}`);
            }
        }

        // (3) DB 삭제
        return await repository.deleteById(logId);
    }
};