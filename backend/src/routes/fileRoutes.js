const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const fileController = require('../controllers/fileController');

router.post('/upload', upload.single('file'), fileController.uploadFile);
router.delete('/:filename', fileController.deleteFile);

module.exports = router;
