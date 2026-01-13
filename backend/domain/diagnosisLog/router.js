const express = require('express');
const router = express.Router();
const controller = require('./controller');
const upload = require('../../utils/multer'); 

// 1. 진단 요청 (POST /api/diagnosis-logs/:plantId)
// 프론트엔드에서 FormData에 'image'라는 키값으로 사진을 보내야 합니다.
router.post('/:plantId', upload.single('image'), controller.createLog);

// 2. 진단 기록 조회 (GET /api/diagnosis-logs/:plantId)
router.get('/:plantId', controller.getLogs);

module.exports = router;