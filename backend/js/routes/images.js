// ============================================================
// Headstart Education — Site Images
// GET   /api/images/:key        — the image itself (public, ETag-cached)
// GET   /api/images             — list with details            (any staff)
// PUT   /api/images/:key        — replace image (raw bytes)    (editor+)
// PATCH /api/images/:key        — edit name / purpose          (editor+)
// POST  /api/images/:key/reset  — restore the original photo   (editor+)
// POST  /api/images?label=Name  — add a new library image     (editor+)
// DELETE /api/images/:key       — delete a library image       (editor+)
// ============================================================
const express = require('express');
const router  = express.Router();
const images  = require('../lib/images');
const { requireStaff, requireEditor } = require('../lib/auth');
const { logAudit } = require('./adminAuth');

const rawImage = express.raw({ type: images.ALLOWED, limit: images.MAX_BYTES });

// Public: the picture itself. `no-cache` = browsers always revalidate with
// the ETag, so a replaced image shows up straight away but unchanged images
// cost only a tiny 304 response.
router.get('/:key', async (req, res, next) => {
  if (req.params.key === 'list') return next();
  try {
    const head = await images.head(req.params.key);
    if (!head) return res.status(404).end();
    const etag = `"${head.key}-${new Date(head.updated_at).getTime()}-${head.size_bytes}"`;
    res.set({ ETag: etag, 'Cache-Control': 'public, no-cache', 'X-Content-Type-Options': 'nosniff' });
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    const row = await images.getData(req.params.key);
    if (!row) return res.status(404).end();
    res.type(row.mime_type).send(row.data);
  } catch (err) {
    console.error('IMAGE SERVE ERROR:', err.message);
    res.status(500).end();
  }
});

router.get('/', requireStaff, async (req, res) => {
  try {
    res.json(await images.list());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:key', requireEditor, rawImage, async (req, res) => {
  try {
    const { key } = req.params;
    if (!images.byKey[key] && !images.isLibrary(key)) return res.status(404).json({ message: 'Unknown image' });
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || !buf.length) {
      return res.status(400).json({ message: 'Send a JPG, PNG, WebP or GIF image file.' });
    }
    const mime = images.sniffMime(buf);
    if (!mime) return res.status(400).json({ message: 'That file is not a valid JPG, PNG, WebP or GIF image.' });
    await images.replace(key, buf, mime, req.admin.username);
    await logAudit(req.admin, 'image.replace', `${key} (${buf.length} bytes)`);
    res.json({ message: 'Image updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Oversized uploads: body-parser throws 413 before reaching the handler.
router.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({ message: 'That image is too large (max 6 MB). Choose a smaller one.' });
  }
  next(err);
});

router.patch('/:key', requireEditor, async (req, res) => {
  try {
    const { key } = req.params;
    if (!images.byKey[key] && !images.isLibrary(key)) return res.status(404).json({ message: 'Unknown image' });
    const label = String((req.body || {}).label || '').trim().slice(0, 150);
    const purpose = String((req.body || {}).purpose || '').trim().slice(0, 1000);
    if (!label) return res.status(400).json({ message: 'Name is required.' });
    await images.updateDetails(key, { label, purpose }, req.admin.username);
    await logAudit(req.admin, 'image.details', key);
    res.json({ message: 'Details saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:key/reset', requireEditor, async (req, res) => {
  try {
    const { key } = req.params;
    if (!images.byKey[key]) return res.status(404).json({ message: 'Unknown image' });
    await images.reset(key, req.admin.username);
    await logAudit(req.admin, 'image.reset', key);
    res.json({ message: 'Original image restored' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add a new library image (upload raw bytes, name in ?label=)
router.post('/', requireEditor, rawImage, async (req, res) => {
  try {
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || !buf.length) return res.status(400).json({ message: 'Choose a JPG, PNG, WebP or GIF image file.' });
    const mime = images.sniffMime(buf);
    if (!mime) return res.status(400).json({ message: 'That file is not a valid JPG, PNG, WebP or GIF image.' });
    const label = String(req.query.label || '').trim();
    if (!label) return res.status(400).json({ message: 'Please give the image a name.' });
    const key = await images.create(buf, mime, label, req.admin.username);
    await logAudit(req.admin, 'image.add', `${key} (${label})`);
    res.status(201).json({ message: 'Image added', key });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:key', requireEditor, async (req, res) => {
  try {
    await images.remove(req.params.key);
    await logAudit(req.admin, 'image.delete', req.params.key);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
