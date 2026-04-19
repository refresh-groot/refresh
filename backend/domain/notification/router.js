const express = require('express');
const router = express.Router();
const controller = require('./controller');

// [GET] /api/notifications/:plantId -> 알림 목록 보기
router.get('/:plantId', controller.getNotifications);

// [PATCH] /api/notifications/read/:id -> 알림 읽음 처리
router.patch('/read/:id', controller.readNotification);

module.exports = router;