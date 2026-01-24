const service = require('./service');

module.exports = {
    // [POST] 하드웨어 -> 서버 데이터 전송
    createEnvironmentLog: async (req, res) => {
        try {
            console.log("실시간 환경 데이터 도착:", req.body);
            const log = await service.recordEnvironment(req.body);
            return res.status(201).json({
                message: '환경 데이터가 저장되었습니다.',
                data: log
            });
        } catch (error) {
            console.error("환경 데이터 저장 에러:", error);
            return res.status(500).json({ message: error.message });
        }
    },

    // [GET] 특정 식물의 환경 이력 조회
    getEnvironmentHistory: async (req, res) => {
        try {
            const { plantId } = req.params;
            const logs = await service.getEnvHistory(plantId);
            return res.status(200).json(logs);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
};