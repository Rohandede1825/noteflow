const Notebook = require('../models/Notebook');
const Page = require('../models/Page');
const fallbackStore = require('../storage/fallbackStore');
const { getDBStatus } = require('../config/db');

// @desc    Get all pages for a notebook
// @route   GET /api/notebooks/:notebookId/pages
exports.getPagesByNotebook = async (req, res, next) => {
  try {
    const { notebookId } = req.params;

    if (!getDBStatus()) {
      const pages = fallbackStore.getPagesByNotebook(notebookId);
      return res.json({ success: true, count: pages.length, data: pages });
    }

    const pages = await Page.find({ notebookId }).sort({ pageNumber: 1 });
    return res.json({ success: true, count: pages.length, data: pages });
  } catch (error) {
    const fallback = fallbackStore.getPagesByNotebook(req.params.notebookId);
    if (fallback) return res.json({ success: true, count: fallback.length, data: fallback });
    next(error);
  }
};

// @desc    Get single page by ID
// @route   GET /api/pages/:id
exports.getPageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!getDBStatus()) {
      const page = fallbackStore.getPageById(id);
      if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
      return res.json({ success: true, data: page });
    }

    const page = await Page.findById(id);
    if (!page) {
      const fallback = fallbackStore.getPageById(id);
      if (fallback) return res.json({ success: true, data: fallback });
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    return res.json({ success: true, data: page });
  } catch (error) {
    const fallback = fallbackStore.getPageById(req.params.id);
    if (fallback) return res.json({ success: true, data: fallback });
    next(error);
  }
};

// @desc    Create new page in notebook
// @route   POST /api/notebooks/:notebookId/pages
exports.createPage = async (req, res, next) => {
  try {
    const { notebookId } = req.params;
    const { title, template, templateConfig, width, height, elements, pdfBackground } = req.body;

    if (!getDBStatus()) {
      const newPage = fallbackStore.createPage(notebookId, req.body);
      if (!newPage) return res.status(404).json({ success: false, message: 'Notebook not found' });
      return res.status(201).json({ success: true, data: newPage });
    }

    const notebook = await Notebook.findById(notebookId);
    if (!notebook) {
      const newPage = fallbackStore.createPage(notebookId, req.body);
      if (newPage) return res.status(201).json({ success: true, data: newPage });
      return res.status(404).json({ success: false, message: 'Notebook not found' });
    }

    const existingCount = await Page.countDocuments({ notebookId });
    const newPageNumber = existingCount + 1;

    const page = await Page.create({
      notebookId,
      pageNumber: newPageNumber,
      title: title || `Page ${newPageNumber}`,
      template: template || notebook.pageTemplate || 'ruled',
      templateConfig: templateConfig || notebook.templateConfig,
      width: width || 1200,
      height: height || 1600,
      elements: elements || [],
      pdfBackground: pdfBackground || null,
      bookmarked: false
    });

    notebook.pages.push(page._id);
    await notebook.save();

    return res.status(201).json({ success: true, data: page });
  } catch (error) {
    console.warn('[Page Controller] DB createPage failed, using fallback:', error.message);
    const newPage = fallbackStore.createPage(req.params.notebookId, req.body);
    if (newPage) return res.status(201).json({ success: true, data: newPage });
    return res.status(404).json({ success: false, message: 'Notebook not found' });
  }
};

// @desc    Update page (debounced autosave elements, title, template, bookmark)
// @route   PUT /api/pages/:id
exports.updatePage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!getDBStatus()) {
      const updated = fallbackStore.updatePage(id, req.body);
      if (!updated) return res.status(404).json({ success: false, message: 'Page not found' });
      return res.json({ success: true, data: updated });
    }

    const page = await Page.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!page) {
      const fallback = fallbackStore.updatePage(id, req.body);
      if (fallback) return res.json({ success: true, data: fallback });
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    await Notebook.findByIdAndUpdate(page.notebookId, { updatedAt: new Date() });

    return res.json({ success: true, data: page });
  } catch (error) {
    const fallback = fallbackStore.updatePage(req.params.id, req.body);
    if (fallback) return res.json({ success: true, data: fallback });
    return res.status(404).json({ success: false, message: 'Page not found' });
  }
};

// @desc    Delete page
// @route   DELETE /api/pages/:id
exports.deletePage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!getDBStatus()) {
      const deleted = fallbackStore.deletePage(id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Page not found' });
      return res.json({ success: true, message: 'Page deleted successfully' });
    }

    const page = await Page.findById(id);
    if (!page) {
      const fallback = fallbackStore.deletePage(id);
      if (fallback) return res.json({ success: true, message: 'Page deleted successfully' });
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const notebookId = page.notebookId;
    await Page.findByIdAndDelete(id);

    await Notebook.findByIdAndUpdate(notebookId, {
      $pull: { pages: id },
      updatedAt: new Date()
    });

    // Re-index remaining pages
    const remainingPages = await Page.find({ notebookId }).sort({ pageNumber: 1 });
    for (let i = 0; i < remainingPages.length; i++) {
      remainingPages[i].pageNumber = i + 1;
      await remainingPages[i].save();
    }

    return res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    const fallback = fallbackStore.deletePage(req.params.id);
    if (fallback) return res.json({ success: true, message: 'Page deleted successfully' });
    return res.status(404).json({ success: false, message: 'Page not found' });
  }
};

// @desc    Duplicate page
// @route   POST /api/pages/:id/duplicate
exports.duplicatePage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!getDBStatus()) {
      const duplicated = fallbackStore.duplicatePage(id);
      if (!duplicated) return res.status(404).json({ success: false, message: 'Page not found' });
      return res.status(201).json({ success: true, data: duplicated });
    }

    const original = await Page.findById(id);
    if (!original) {
      const fallback = fallbackStore.duplicatePage(id);
      if (fallback) return res.status(201).json({ success: true, data: fallback });
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const newPage = await Page.create({
      notebookId: original.notebookId,
      pageNumber: original.pageNumber + 1,
      title: `${original.title || 'Page'} (Copy)`,
      template: original.template,
      templateConfig: original.templateConfig,
      width: original.width,
      height: original.height,
      elements: original.elements,
      pdfBackground: original.pdfBackground,
      bookmarked: false
    });

    await Notebook.findByIdAndUpdate(original.notebookId, {
      $push: { pages: newPage._id },
      updatedAt: new Date()
    });

    // Shift succeeding pages
    await Page.updateMany(
      {
        notebookId: original.notebookId,
        _id: { $ne: newPage._id },
        pageNumber: { $gt: original.pageNumber }
      },
      { $inc: { pageNumber: 1 } }
    );

    return res.status(201).json({ success: true, data: newPage });
  } catch (error) {
    const fallback = fallbackStore.duplicatePage(req.params.id);
    if (fallback) return res.status(201).json({ success: true, data: fallback });
    return res.status(404).json({ success: false, message: 'Page not found' });
  }
};

// @desc    Reorder pages in a notebook
// @route   PUT /api/notebooks/:notebookId/reorder
exports.reorderPages = async (req, res, next) => {
  try {
    const { notebookId } = req.params;
    const { orderedPageIds } = req.body;

    if (!orderedPageIds || !Array.isArray(orderedPageIds)) {
      return res.status(400).json({ success: false, message: 'orderedPageIds array is required' });
    }

    if (!getDBStatus()) {
      fallbackStore.reorderPages(notebookId, orderedPageIds);
      return res.json({ success: true, message: 'Pages reordered successfully' });
    }

    const updates = orderedPageIds.map((pId, index) => {
      return Page.findByIdAndUpdate(pId, { pageNumber: index + 1 });
    });

    await Promise.all(updates);
    await Notebook.findByIdAndUpdate(notebookId, {
      pages: orderedPageIds,
      updatedAt: new Date()
    });

    return res.json({ success: true, message: 'Pages reordered successfully' });
  } catch (error) {
    fallbackStore.reorderPages(req.params.notebookId, req.body.orderedPageIds || []);
    return res.json({ success: true, message: 'Pages reordered successfully' });
  }
};
