const { DiagnosisLog } = require('../index');

module.exports = {
  // DB 저장
  create: async (logData) => {
    return await DiagnosisLog.create(logData);
  },

  // DB 조회 (오름차순 정렬)
  findAllByPlantId: async (plantId) => {
    return await DiagnosisLog.findAll({
      where: { plant_id: plantId },
      order: [['diagnosis_date', 'ASC']],  //최신 채팅이 맨밑에
    });
  }
};