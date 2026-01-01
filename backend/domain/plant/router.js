const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/', controller.addPlant);
router.delete('/:id', controller.removePlant);

module.exports = router;