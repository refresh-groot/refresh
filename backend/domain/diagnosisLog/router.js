const express = require('express');
const router = express.Router();
const controller = require('./controller');
const upload = require('../../utils/multer'); // 이미지 업로드 설정

// 1. 진단방 생성 (POST /api/diagnosis-logs/:plantId)
router.post('/:plantId', upload.array('images', 5), controller.addDiagnosisLog);

// 2. 진단방 목록 조회 (GET /api/diagnosis-logs/:plantId)
router.get('/:plantId', controller.getDiagnosisLogs);

// 3. 진단방 이름 변경 (PATCH /api/diagnosis-logs/:logId/title)
router.patch('/:logId/title', controller.updateDiagnosisTitle);

// 4. 진단방 삭제 (DELETE /api/diagnosis-logs/:logId)
router.delete('/:logId', controller.deleteDiagnosisLog);

// 5. 방 이름 변경
router.put('/session/:sessionId', controller.updateSessionTitle); 

// 6. 방 삭제
router.delete('/session/:sessionId', controller.deleteSession);   

module.exports = router;