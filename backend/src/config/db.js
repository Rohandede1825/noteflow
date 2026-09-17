const mongoose = require('mongoose');

let isConnected = false;

// Helper to sanitize MongoDB connection string if it has invalid multi-slash dbNames
function cleanMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return uri;
  try {
    const match = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/]+\/)([^?]+)(\?.*)?$/);
    if (match) {
      const prefix = match[1];
      let dbName = match[2];
      const suffix = match[3] || '';
      if (dbName.includes('/')) {
        const parts = dbName.split('/').filter(Boolean);
        const cleanDbName = parts[parts.length - 1] || 'noteflow';
        console.log(`[MongoDB] Cleaned multi-segment dbName '${dbName}' -> '${cleanDbName}'`);
        return `${prefix}${cleanDbName}${suffix}`;
      }
    }
  } catch (e) {
    console.warn('[MongoDB] URI cleanup warning:', e.message);
  }
  return uri;
}

const connectDB = async () => {
  const rawUri = process.env.MONGO_URI;
  if (!rawUri) {
    isConnected = false;
    console.log('[Storage] MONGO_URI not provided. Running in persistent fallback JSON storage mode.');
    return false;
  }

  const targetUri = cleanMongoUri(rawUri);

  try {
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB] Connection failed: ${error.message}. Switching to Local Fallback Storage mode.`);
    return false;
  }
};

const getDBStatus = () => isConnected;

module.exports = { connectDB, getDBStatus };

