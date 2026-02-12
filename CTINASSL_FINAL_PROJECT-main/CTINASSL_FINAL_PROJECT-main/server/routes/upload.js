// server/routes/upload.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const authAdmin = require('../middlewares/authAdmin');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../public/assets');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowlist for image uploads (validated by sniffing bytes)
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

function safeBaseName(originalName) {
  const base = path.basename(originalName || 'upload');
  // Keep only a conservative set of characters
  return base.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
}

async function sniffFileType(buffer) {
  // file-type is ESM; use dynamic import from CommonJS
  const mod = await import('file-type');
  return mod.fileTypeFromBuffer(buffer);
}

// POST /api/upload
router.post('/', authAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const detected = await sniffFileType(req.file.buffer);
    if (!detected || !ALLOWED_MIME.has(detected.mime)) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    const id = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString('hex');
    const original = safeBaseName(req.file.originalname);
    const filename = `${id}-${original}`.replace(/\.+/g, '.');
    const finalName = filename.toLowerCase().endsWith(`.${detected.ext}`)
      ? filename
      : `${filename}.${detected.ext}`;
    const fullPath = path.join(UPLOAD_DIR, finalName);

    await fs.promises.writeFile(fullPath, req.file.buffer, { flag: 'wx' });

    const imageUrl = `/assets/${finalName}`;
    return res.json({ imageUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
