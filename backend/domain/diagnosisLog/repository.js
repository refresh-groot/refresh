const { DiagnosisLog } = require('../index');

module.exports = {
  // DB 저장
  create: async (logData) => {
    return await DiagnosisLog.create(logData);
  },

  // DB 조회 (내림차순 정렬)
  findAllByPlantId: async (plantId) => {
    return await DiagnosisLog.findAll({
      where: { plant_id: plantId },
      order: [['diagnosis_date', 'DESC']],  //최신 채팅이 맨위에
    });
  }
};