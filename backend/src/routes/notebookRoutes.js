const express = require('express');
const router = express.Router();
const notebookController = require('../controllers/notebookController');
const pageController = require('../controllers/pageController');

// Notebooks CRUD
router.route('/')
  .get(notebookController.getNotebooks)
  .post(notebookController.createNotebook);

// Special operations
router.post('/import/noteflow', notebookController.importNoteFlow);

router.route('/:id')
  .get(notebookController.getNotebookById)
  .put(notebookController.updateNotebook)
  .delete(notebookController.deleteNotebook);

router.post('/:id/duplicate', notebookController.duplicateNotebook);
router.get('/:id/export/noteflow', notebookController.exportNoteFlow);

// Nested page routes under notebook
router.route('/:notebookId/pages')
  .get(pageController.getPagesByNotebook)
  .post(pageController.createPage);

router.put('/:notebookId/reorder', pageController.reorderPages);

module.exports = router;
