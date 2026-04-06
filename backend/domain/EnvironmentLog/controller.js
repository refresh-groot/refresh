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

    // [GET] 특정 식물의 환경 이력 조회 (전체 로그)
    getEnvironmentHistory: async (req, res) => {
        try {
            const { plantId } = req.params;
            const logs = await service.getEnvHistory(plantId);
            return res.status(200).json(logs);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    // [신규 추가] [GET] 주간 차트용 통계 및 에러 이력 조회
    getWeeklyChartStats: async (req, res) => {
        try {
            const { plantId } = req.params;
            // 서비스에서 가공된 7일치 평균 데이터와 에러 목록을 가져옵니다.
            const stats = await service.getWeeklyChartData(plantId);
            return res.status(200).json(stats);
        } catch (error) {
            console.error("주간 통계 조회 에러:", error);
            return res.status(500).json({ message: error.message });
        }
    }
};