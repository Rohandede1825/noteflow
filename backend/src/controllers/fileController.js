const path = require('path');
const fs = require('fs');

// @desc    Upload an image or document asset
// @route   POST /api/files/upload
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.status(201).json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete uploaded file
// @route   DELETE /api/files/:filename
exports.deleteFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    // Security check against directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../../uploads', safeFilename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ success: true, message: 'File deleted' });
    }
    return res.status(404).json({ success: false, message: 'File not found' });
  } catch (error) {
    next(error);
  }
};
