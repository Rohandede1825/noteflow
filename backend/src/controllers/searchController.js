const Notebook = require('../models/Notebook');
const Page = require('../models/Page');
const fallbackStore = require('../storage/fallbackStore');
const { getDBStatus } = require('../config/db');

// @desc    Search across notebooks, pages, and handwritten/text elements
// @route   GET /api/search?q=query
exports.search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, count: 0, data: [] });
    }

    if (!getDBStatus()) {
      const results = fallbackStore.search(q);
      return res.json({ success: true, count: results.length, data: results });
    }

    const queryRegex = new RegExp(q.trim(), 'i');

    // 1. Search in notebooks
    const matchingNotebooks = await Notebook.find({
      inTrash: false,
      $or: [
        { title: queryRegex },
        { tags: { $in: [queryRegex] } }
      ]
    }).select('title cover theme updatedAt pages');

    const results = [];

    matchingNotebooks.forEach(nb => {
      results.push({
        type: 'notebook',
        id: nb._id,
        notebookId: nb._id,
        title: nb.title,
        snippet: `Notebook: ${nb.title} (${nb.pages.length} pages)`,
        updatedAt: nb.updatedAt
      });
    });

    // 2. Search in pages (page titles + text elements)
    const matchingPages = await Page.find({
      $or: [
        { title: queryRegex },
        { 'elements.text': queryRegex }
      ]
    }).populate('notebookId', 'title inTrash');

    matchingPages.forEach(p => {
      if (!p.notebookId || p.notebookId.inTrash) return;

      let matchedSnippet = '';
      if (p.title && queryRegex.test(p.title)) {
        matchedSnippet = `Page title: ${p.title}`;
      } else if (p.elements && Array.isArray(p.elements)) {
        for (const el of p.elements) {
          if (el.type === 'text' && el.text && queryRegex.test(el.text)) {
            matchedSnippet = el.text.length > 80 ? el.text.slice(0, 80) + '...' : el.text;
            break;
          }
        }
      }

      results.push({
        type: 'page',
        id: p._id,
        pageId: p._id,
        notebookId: p.notebookId._id,
        notebookTitle: p.notebookId.title,
        pageNumber: p.pageNumber,
        title: p.title || `Page ${p.pageNumber}`,
        snippet: matchedSnippet || `Page ${p.pageNumber}`,
        updatedAt: p.updatedAt
      });
    });

    return res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    const fallbackResults = fallbackStore.search(req.query.q || '');
    return res.json({ success: true, count: fallbackResults.length, data: fallbackResults });
  }
};
