const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

router.route('/:id')
  .get(pageController.getPageById)
  .put(pageController.updatePage)
  .delete(pageController.deletePage);

router.post('/:id/duplicate', pageController.duplicatePage);

module.exports = router;
