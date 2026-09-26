// backend/domain/plant/router.js
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const upload = require('../../utils/multer'); // utils 폴더의 multer 설정 불러오기
const { requirePlantOwner } = require('../../middleware/plantAuthorization');

// 1. 식물 등록: 사진('img')을 먼저 업로드한 후 컨트롤러 실행
// 변경: 어떤 필드명이든 일단 다 받도록 .any()로 변경
router.post('/', upload.any(), controller.addPlant);

//식물 리스트 조회
router.get('/', controller.getPlants);

// 2. 식물 삭제: 기존 기능 유지 (쓰레기통 아이콘: ?mode=permanent 사용)
router.delete('/:id', requirePlantOwner('id'), controller.removePlant);

// 3. 식물 상태 수정 및 보관함 이동 (연필 아이콘: 사망 이유 기록 포함)
// 데이터를 부분적으로 수정하므로 PATCH 메서드를 사용
router.patch('/:id/archive', requirePlantOwner('id'), controller.archivePlant);

// 4. 자동 급수 내용 이동
// ESP32가 로그인 세션 없이 주기적으로 급수 기준을 동기화하므로 조회는 기기 연동용으로 유지한다.
router.get('/:id/hardware', controller.getHardwareSettings);
router.patch('/:id/hardware', requirePlantOwner('id'), controller.updateHardwareSettings);
module.exports = router;
