const express = require('express');
const router = express.Router();
const controller = require('./controller');
const upload = require('../../utils/multer');

router.get('/', controller.getPosts);
router.post('/', upload.single('image'), controller.createPost);
router.get('/:id', controller.getPostDetail);
router.delete('/:id', controller.deletePost);

module.exports = router;