const service = require('./service');

module.exports = {
  // 1. 진단 요청 및 기록 저장
  createLog: async (req, res) => {
    try {
      const { plantId } = req.params;
      
      // multer를 통해 업로드된 파일 객체 (없으면 undefined)
      const file = req.file; 
      
      // 채팅처럼 텍스트 질문이 올 수도 있으니 body에서 받음
      const { question } = req.body; 

      if (!plantId) {
        return res.status(400).json({ message: '식물 ID가 필요합니다.' });
      }

      // 서비스에게 진단 요청 (파일이 없으면 없는 대로 처리)
      const newLog = await service.addDiagnosisLog({
        plantId,
        file,
        question
      });

      return res.status(201).json({ 
        message: '진단 요청이 성공적으로 처리되었습니다.', 
        data: newLog 
      });

    } catch (error) {
      console.error('진단 중 에러 발생:', error);
      return res.status(500).json({ message: '진단 중 서버 에러가 발생했습니다.' });
    }
  },

  // 2. 진단 이력 조회 
  getLogs: async (req, res) => {
    try {
      const { plantId } = req.params;
      
      const logs = await service.getDiagnosisLogs(plantId);

      return res.status(200).json({ 
        message: '진단 이력 조회 성공', 
        count: logs.length,
        logs: logs 
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: '서버 에러가 발생했습니다.' });
    }
  }
};