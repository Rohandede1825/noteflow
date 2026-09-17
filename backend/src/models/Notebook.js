const mongoose = require('mongoose');

const notebookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notebook title is required'],
    trim: true,
    default: 'Untitled Notebook'
  },
  cover: {
    type: String,
    default: 'classic-dark'
  },
  theme: {
    type: String,
    enum: ['dark', 'light', 'system'],
    default: 'dark'
  },
  pageTemplate: {
    type: String,
    enum: ['ruled', 'dotted', 'grid', 'blank'],
    default: 'ruled'
  },
  templateConfig: {
    lineSpacing: { type: Number, default: 32 },
    dotSize: { type: Number, default: 1.5 },
    gridSize: { type: Number, default: 28 },
    lineColor: { type: String, default: 'rgba(255, 255, 255, 0.08)' },
    backgroundColor: { type: String, default: '#1c1e22' }
  },
  pages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page'
  }],
  favorite: {
    type: Boolean,
    default: false
  },
  inTrash: {
    type: Boolean,
    default: false
  },
  trashedAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  thumbnail: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notebook', notebookSchema);
