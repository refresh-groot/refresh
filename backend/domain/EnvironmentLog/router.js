const express = require('express');
const router = express.Router();
const controller = require('./controller');

// [POST] /api/environment-log -> 실시간 센서 데이터 받기
router.post('/', controller.createEnvironmentLog);

// [GET] /api/environment-log/:plantId -> 해당 식물의 환경 기록 보기 (전체 이력)
router.get('/:plantId', controller.getEnvironmentHistory);

// [신규 추가] [GET] /api/environment-log/stats/:plantId -> 주간 통계 및 에러 이력 보기 (차트용)
router.get('/stats/:plantId', controller.getWeeklyChartStats);

module.exports = router;