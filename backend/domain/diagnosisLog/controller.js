const service = require('./service');

module.exports = {
  // 1. 진단 기록 생성하기
  createDiagnosisLog: async (req, res) => {
    try {
      // (1) 사용자가 보낸 데이터 꺼내기
      const { plantId } = req.params;
      const file = req.file; 
      const { question } = req.body;

      // (2) 서비스(Service)에게 핵심 업무 위임
      const newLog = await service.addDiagnosisLog({ plantId, file, question });

      // (3) 성공 응답 보내기 (201: 잘 만들어졌다)
      res.status(201).json({
        message: '진단 요청이 성공했습니다.',
        data: newLog
      });
    } catch (error) {
      // (4) 에러 처리: 뭔가 잘못되면 500 에러를 보냅니다.
      console.error(error);
      res.status(500).json({ message: '서버 에러 발생' });
    }
  },

  // 2. 진단 기록 조회하기
  getDiagnosisLogs: async (req, res) => {
    try {
      const { plantId } = req.params;
      
      // 서비스에게 "이 식물 ID로 된 기록 다 가져와"라고 시킴
      const logs = await service.getDiagnosisLogs(plantId);

      res.status(200).json({
        message: '조회 성공',
        count: logs.length,
        logs: logs
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '서버 에러' });
    }
  }
};