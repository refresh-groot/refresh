// backend/domain/wateringLog/router.js
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const upload = require('../../utils/multer'); // [수정] 공통 멀터 설정 가져오기

// [POST] /api/watering-log -> 급수 기록하기
router.post('/', controller.createWateringLog);

// [GET] /api/watering-log/:plantId -> 해당 식물의 기록 보기
router.get('/:plantId', controller.getWateringHistory);


// [PATCH] 특정 급수 이력에 사진 추가 (사용자용)
// upload.single('image')의 'image'는 포스트맨이나 프론트에서 보낼 Key 이름
router.patch('/:id/image', upload.single('image'), controller.uploadLogImage);
module.exports = router;