const express = require('express');
const router = express.Router();
const controller = require('./controller');
const upload = require('../../utils/multer');

router.get('/', controller.getPosts);
router.post('/', upload.single('image'), controller.createPost); // [8번 기능 포함]
router.get('/:id', controller.getPostDetail);
router.delete('/:id', controller.deletePost);

// ---------------------------------------------------------
// [추가] 5. 좋아요 토글
// ---------------------------------------------------------
router.post('/:id/like', controller.toggleLike);

// ---------------------------------------------------------
// [추가] 6. 댓글 목록 조회 & 7. 댓글 등록
// ---------------------------------------------------------
router.get('/:id/comments', controller.getComments);
router.post('/:id/comments', controller.createComment);

module.exports = router;