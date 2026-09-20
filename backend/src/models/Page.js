const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  pressure: { type: Number, default: 0.5 }
}, { _id: false });

const elementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['pen', 'pencil', 'highlighter', 'shape', 'line', 'text', 'image'],
    required: true
  },
  // Vector stroke properties
  points: [pointSchema],
  color: { type: String, default: '#ffffff' },
  width: { type: Number, default: 2 },
  opacity: { type: Number, default: 1 },
  penType: { type: String, default: 'ball' },
  
  // Shape/Line properties
  shapeType: { type: String, default: 'rectangle' }, // rect, roundedRect, circle, ellipse, triangle, star, polygon, line, arrow, doubleArrow
  fillColor: { type: String, default: 'transparent' },
  isDashed: { type: Boolean, default: false },
  
  // Position & Box (for shapes, text, images)
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  width_box: { type: Number, default: 0 },
  height_box: { type: Number, default: 0 },
  rotation: { type: Number, default: 0 },

  // Text properties
  text: { type: String, default: '' },
  fontSize: { type: Number, default: 18 },
  fontFamily: { type: String, default: 'Inter' },
  fontWeight: { type: String, default: 'normal' },
  fontStyle: { type: String, default: 'normal' },
  textDecoration: { type: String, default: 'none' },
  textAlign: { type: String, default: 'left' },

  // Image properties
  src: { type: String, default: '' },
  aspectRatio: { type: Number, default: 1 },

  zIndex: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const pageSchema = new mongoose.Schema({
  notebookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notebook',
    required: true
  },
  pageNumber: {
    type: Number,
    required: true,
    default: 1
  },
  title: {
    type: String,
    default: ''
  },
  template: {
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
  width: {
    type: Number,
    default: 720
  },
  height: {
    type: Number,
    default: 960
  },
  elements: [elementSchema],
  bookmarked: {
    type: Boolean,
    default: false
  },
  pdfBackground: {
    type: String, // Data URL or URL of imported PDF background page
    default: null
  },
  thumbnail: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Page', pageSchema);
