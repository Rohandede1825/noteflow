const Notebook = require('../models/Notebook');
const Page = require('../models/Page');
const fallbackStore = require('../storage/fallbackStore');
const { getDBStatus } = require('../config/db');

// @desc    Get all notebooks (supports filtering by favorite, inTrash)
// @route   GET /api/notebooks
exports.getNotebooks = async (req, res, next) => {
  try {
    const { favorite, inTrash } = req.query;
    const query = {};
    if (inTrash !== undefined) {
      query.inTrash = inTrash === 'true';
    } else {
      query.inTrash = false;
    }
    if (favorite !== undefined) {
      query.favorite = favorite === 'true';
    }

    if (!getDBStatus()) {
      const notebooks = fallbackStore.getNotebooks(query);
      return res.json({ success: true, count: notebooks.length, data: notebooks });
    }

    const notebooks = await Notebook.find(query)
      .populate('pages')
      .sort({ updatedAt: -1 });

    return res.json({ success: true, count: notebooks.length, data: notebooks });
  } catch (error) {
    console.warn('[Notebook Controller] DB getNotebooks failed, using fallback:', error.message);
    const notebooks = fallbackStore.getNotebooks(req.query || {});
    return res.json({ success: true, count: notebooks.length, data: notebooks });
  }
};

// @desc    Get single notebook with all populated pages
// @route   GET /api/notebooks/:id
exports.getNotebookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!getDBStatus()) {
      const notebook = fallbackStore.getNotebookById(id);
      if (!notebook) {
        return res.status(404).json({ success: false, message: 'Notebook not found' });
      }
      return res.json({ success: true, data: notebook });
    }

    const notebook = await Notebook.findById(id).populate({
      path: 'pages',
      options: { sort: { pageNumber: 1 } }
    });

    if (!notebook) {
      const fallback = fallbackStore.getNotebookById(id);
      if (fallback) return res.json({ success: true, data: fallback });
      return res.status(404).json({ success: false, message: 'Notebook not found' });
    }

    return res.json({ success: true, data: notebook });
  } catch (error) {
    console.warn('[Notebook Controller] DB getNotebookById failed, using fallback:', error.message);
    const fallback = fallbackStore.getNotebookById(req.params.id);
    if (fallback) return res.json({ success: true, data: fallback });
    return res.status(404).json({ success: false, message: 'Notebook not found' });
  }
};

// @desc    Create new notebook
// @route   POST /api/notebooks
exports.createNotebook = async (req, res, next) => {
  try {
    const { title, cover, theme, pageTemplate, templateConfig, tags } = req.body;

    if (!getDBStatus()) {
      const notebook = fallbackStore.createNotebook(req.body);
      return res.status(201).json({ success: true, data: notebook });
    }

    const notebook = await Notebook.create({
      title: title || 'Untitled Notebook',
      cover: cover || 'classic-dark',
      theme: theme || 'dark',
      pageTemplate: pageTemplate || 'ruled',
      templateConfig: templateConfig || {
        lineSpacing: 32,
        dotSize: 1.5,
        gridSize: 28,
        lineColor: theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        backgroundColor: theme === 'light' ? '#ffffff' : '#1c1e22'
      },
      tags: tags || []
    });

    // Create initial first page
    const firstPage = await Page.create({
      notebookId: notebook._id,
      pageNumber: 1,
      title: 'Page 1',
      template: notebook.pageTemplate,
      templateConfig: notebook.templateConfig,
      elements: []
    });

    notebook.pages = [firstPage._id];
    await notebook.save();

    const populated = await Notebook.findById(notebook._id).populate('pages');
    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.warn('[Notebook Controller] DB createNotebook failed, using fallback:', error.message);
    const fallback = fallbackStore.createNotebook(req.body);
    return res.status(201).json({ success: true, data: fallback });
  }
};

// @desc    Update notebook (title, cover, theme, favorite, templateConfig, inTrash)
// @route   PUT /api/notebooks/:id
exports.updateNotebook = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!getDBStatus()) {
      const updated = fallbackStore.updateNotebook(id, req.body);
      if (!updated) return res.status(404).json({ success: false, message: 'Notebook not found' });
      return res.json({ success: true, data: updated });
    }

    const notebook = await Notebook.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    }).populate('pages');

    if (!notebook) {
      const fallback = fallbackStore.updateNotebook(id, req.body);
      if (fallback) return res.json({ success: true, data: fallback });
      return res.status(404).json({ success: false, message: 'Notebook not found' });
    }

    return res.json({ success: true, data: notebook });
  } catch (error) {
    const fallback = fallbackStore.updateNotebook(req.params.id, req.body);
    if (fallback) return res.json({ success: true, data: fallback });
    return res.status(404).json({ success: false, message: 'Notebook not found' });
  }
};

// @desc    Delete or soft-delete notebook
// @route   DELETE /api/notebooks/:id
exports.deleteNotebook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    const isPermanent = permanent === 'true';

    if (!getDBStatus()) {
      const deleted = fallbackStore.deleteNotebook(id, isPermanent);
      if (!deleted) return res.status(404).json({ success: false, message: 'Notebook not found' });
      return res.json({ success: true, message: isPermanent ? 'Notebook permanently deleted' : 'Moved to trash' });
    }

    if (isPermanent) {
      await Page.deleteMany({ notebookId: id });
      await Notebook.findByIdAndDelete(id);
    } else {
      await Notebook.findByIdAndUpdate(id, { inTrash: true, trashedAt: new Date() });
    }

    return res.json({ success: true, message: isPermanent ? 'Notebook permanently deleted' : 'Moved to trash' });
  } catch (error) {
    const fallback = fallbackStore.deleteNotebook(req.params.id, req.query.permanent === 'true');
    if (fallback) return res.json({ success: true, message: 'Deleted' });
    return res.status(404).json({ success: false, message: 'Notebook not found' });
  }
};

// @desc    Duplicate notebook with all its pages
// @route   POST /api/notebooks/:id/duplicate
exports.duplicateNotebook = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!getDBStatus()) {
      const duplicated = fallbackStore.duplicateNotebook(id);
      if (!duplicated) return res.status(404).json({ success: false, message: 'Notebook not found' });
      return res.status(201).json({ success: true, data: duplicated });
    }

    const original = await Notebook.findById(id).populate('pages');
    if (!original) {
      const fallback = fallbackStore.duplicateNotebook(id);
      if (fallback) return res.status(201).json({ success: true, data: fallback });
      return res.status(404).json({ success: false, message: 'Notebook not found' });
    }

    const newNotebook = await Notebook.create({
      title: `${original.title} (Copy)`,
      cover: original.cover,
      theme: original.theme,
      pageTemplate: original.pageTemplate,
      templateConfig: original.templateConfig,
      tags: original.tags,
      pages: []
    });

    const newPagePromises = original.pages.map((p, index) => {
      return Page.create({
        notebookId: newNotebook._id,
        pageNumber: index + 1,
        title: p.title,
        template: p.template,
        templateConfig: p.templateConfig,
        width: p.width,
        height: p.height,
        elements: p.elements,
        bookmarked: false
      });
    });

    const newPages = await Promise.all(newPagePromises);
    newNotebook.pages = newPages.map(p => p._id);
    await newNotebook.save();

    const populated = await Notebook.findById(newNotebook._id).populate('pages');
    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.warn('[Notebook Controller] DB duplicateNotebook failed, using fallback:', error.message);
    const fallback = fallbackStore.duplicateNotebook(req.params.id);
    if (fallback) return res.status(201).json({ success: true, data: fallback });
    return res.status(404).json({ success: false, message: 'Notebook not found' });
  }
};

// @desc    Export .noteflow standalone file
// @route   GET /api/notebooks/:id/export/noteflow
exports.exportNoteFlow = async (req, res, next) => {
  try {
    const { id } = req.params;
    let notebook;

    if (!getDBStatus()) {
      notebook = fallbackStore.getNotebookById(id);
    } else {
      notebook = await Notebook.findById(id).populate('pages');
    }

    if (!notebook) {
      notebook = fallbackStore.getNotebookById(id);
    }

    if (!notebook) {
      return res.status(404).json({ success: false, message: 'Notebook not found' });
    }

    const bundle = {
      version: 1,
      format: 'noteflow',
      exportedAt: new Date().toISOString(),
      notebook: {
        title: notebook.title,
        cover: notebook.cover,
        theme: notebook.theme,
        pageTemplate: notebook.pageTemplate,
        templateConfig: notebook.templateConfig,
        tags: notebook.tags
      },
      pages: notebook.pages
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(notebook.title)}.noteflow"`);
    return res.json(bundle);
  } catch (error) {
    const fallback = fallbackStore.getNotebookById(req.params.id);
    if (fallback) {
      return res.json({
        version: 1,
        format: 'noteflow',
        exportedAt: new Date().toISOString(),
        notebook: fallback,
        pages: fallback.pages
      });
    }
    next(error);
  }
};

// @desc    Import .noteflow standalone file
// @route   POST /api/notebooks/import/noteflow
exports.importNoteFlow = async (req, res, next) => {
  try {
    const bundle = req.body;
    if (!bundle || !bundle.notebook) {
      return res.status(400).json({ success: false, message: 'Invalid .noteflow bundle payload' });
    }

    if (!getDBStatus()) {
      const imported = fallbackStore.importNoteFlow(bundle);
      return res.status(201).json({ success: true, data: imported });
    }

    const newNotebook = await Notebook.create({
      title: bundle.notebook.title ? `${bundle.notebook.title} (Imported)` : 'Imported Notebook',
      cover: bundle.notebook.cover || 'classic-dark',
      theme: bundle.notebook.theme || 'dark',
      pageTemplate: bundle.notebook.pageTemplate || 'ruled',
      templateConfig: bundle.notebook.templateConfig,
      tags: bundle.notebook.tags || [],
      pages: []
    });

    const pagePromises = (bundle.pages || []).map((p, index) => {
      return Page.create({
        notebookId: newNotebook._id,
        pageNumber: index + 1,
        title: p.title || `Page ${index + 1}`,
        template: p.template || newNotebook.pageTemplate,
        templateConfig: p.templateConfig || newNotebook.templateConfig,
        width: p.width || 720,
        height: p.height || 960,
        elements: p.elements || [],
        pdfBackground: p.pdfBackground || null,
        bookmarked: false
      });
    });

    const createdPages = await Promise.all(pagePromises);
    newNotebook.pages = createdPages.map(p => p._id);
    await newNotebook.save();

    const populated = await Notebook.findById(newNotebook._id).populate('pages');
    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.warn('[Notebook Controller] DB importNoteFlow failed, using fallback:', error.message);
    const imported = fallbackStore.importNoteFlow(req.body);
    return res.status(201).json({ success: true, data: imported });
  }
};
