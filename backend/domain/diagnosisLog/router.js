const express = require('express');
const router = express.Router();
const controller = require('./controller');
const upload = require('../../utils/multer'); // 파일 업로드를 도와주는 도구(미들웨어)

// 1. 진단 요청 (POST)
// 이 코드가 사진을 받아서 서버 폴더에 저장해주고, 그 다음 controller.createDiagnosisLog로 넘깁니다.
router.post('/:plantId', upload.single('image'), controller.createDiagnosisLog);

// 2. 기록 조회 (GET)
// 특정 식물의 진단 기록을 가져오는 요청입니다.
router.get('/:plantId', controller.getDiagnosisLogs);

module.exports = router;