// backend/domain/wateringLog/router.js
const express = require('express');
const router = express.Router();
const controller = require('./controller');

// [POST] /api/watering-log -> 급수 기록하기
router.post('/', controller.createWateringLog);

// [GET] /api/watering-log/:plantId -> 해당 식물의 기록 보기
router.get('/:plantId', controller.getWateringHistory);

module.exports = router;