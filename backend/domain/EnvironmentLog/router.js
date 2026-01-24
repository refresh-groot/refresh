const express = require('express');
const router = express.Router();
const controller = require('./controller');

// [POST] /api/environment-log -> 실시간 센서 데이터 받기
router.post('/', controller.createEnvironmentLog);

// [GET] /api/environment-log/:plantId -> 해당 식물의 환경 기록 보기
router.get('/:plantId', controller.getEnvironmentHistory);

module.exports = router;