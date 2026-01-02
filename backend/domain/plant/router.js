// backend/domain/plant/router.js
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const upload = require('../../utils/multer'); // utils 폴더의 multer 설정 불러오기

// 1. 식물 등록: 사진('img')을 먼저 업로드한 후 컨트롤러 실행
// 변경: 어떤 필드명이든 일단 다 받도록 .any()로 변경
router.post('/', upload.any(), controller.addPlant);

//식물 리스트 조회
router.get('/', controller.getPlants);
// 2. 식물 삭제: 기존 기능 유지
router.delete('/:id', controller.removePlant);

module.exports = router;