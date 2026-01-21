const repository = require('./repository');
const axios = require('axios');           // 파이썬 서버에 전화 거는 도구
const FormData = require('form-data');    // 사진을 택배 상자에 포장하는 도구
const fs = require('fs');                 // 파일을 읽어들이는 도구

// 파이썬 AI 서버와 통신하는 함수 
const requestAIAnalysis = async (file, question) => {
  try {
    // 1. 택배 상자(FormData) 준비
    const formData = new FormData();

    // 사진이 있을 때만 담기
    if (file) {
      formData.append('image', fs.createReadStream(file.path));
    }

    // 질문이 있으면 담기 
    if (question) {
      formData.append('question', question);
    }

    // 2. AI 서버 주소 (허깅페이스 주소)
    const pythonServerUrl = 'https://ys1235-smartplant.hf.space/predict';
    
    // 3. 전송 (POST)
    console.log("🚀 AI 서버로 요청 보냄..."); // 로그 추가
    const response = await axios.post(pythonServerUrl, formData, {
      headers: { ...formData.getHeaders() }, 
    });

    console.log("✅ AI 응답 도착:", response.data); // 로그 추가 (여기서 데이터 확인 가능)
    return response.data; 

  } catch (error) {
    console.error('❌ AI 연결 실패:', error.message);
    return { 
        result: '통신 오류', 
        recommendation: 'AI 서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.', 
        confidence: 0 
    };
  }
};

module.exports = {
  addDiagnosisLog: async ({ plantId, file, question }) => {
    // 1. 이미지 경로 정리
    const imageUrl = file ? `/uploads/${file.filename}` : null;
    
    // 2. AI에게 분석 요청
    const aiResponse = await requestAIAnalysis(file, question);

    // 3. DB 저장 (변수명 매칭 수정됨 ⭐)
    const newLog = await repository.create({
      plant_id: plantId,
      image_url: imageUrl,
      question: question, 
      result: aiResponse.result || '상담', // 혹시 비어있으면 기본값
      recommendation: aiResponse.recommendation || 'AI가 답변을 생성하지 못했습니다.',
      
      confidence: aiResponse.confidence || 0.0
    });

    return newLog;
  },

  getDiagnosisLogs: async (plantId) => {
    return await repository.findAllByPlantId(plantId);
  }
};