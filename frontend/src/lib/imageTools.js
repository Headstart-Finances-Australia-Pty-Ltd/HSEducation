// Browser-side image helpers used by the Admin Console.

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
  img.src = url;
});

const toPngBlob = (canvas) => new Promise((resolve, reject) =>
  canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process that image.'))), 'image/png'));

// Prepares an uploaded logo:
//  • removes a solid white/near-white background (only the part connected to the
//    picture's edge, so white details inside the artwork — eyes, teeth, lettering
//    counters — are kept),
//  • trims empty margins and centres it on a square canvas,
//  • saves it as a PNG with a transparent background.
// A logo that is already transparent keeps its transparency.
export async function makeLogoTransparent(file, { maxEdge = 640 } = {}) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Please choose a JPG, PNG or WebP logo.');
  const img = await loadImage(file);
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const N = w * h;

  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  const alreadyTransparent = corners.every(([x, y]) => d[(y * w + x) * 4 + 3] < 10);

  if (!alreadyTransparent) {
    const isBg = (i) => d[i * 4 + 3] < 10 || (d[i * 4] >= 232 && d[i * 4 + 1] >= 232 && d[i * 4 + 2] >= 232);
    const bg = new Uint8Array(N);
    const stack = [];
    const push = (x, y) => { const i = y * w + x; if (!bg[i] && isBg(i)) { bg[i] = 1; stack.push(i); } };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (stack.length) {            // flood-fill the background inwards from the edges
      const i = stack.pop(); const x = i % w; const y = (i - x) / w;
      if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y);
      if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1);
    }
    const touchesBg = (i) => {
      const x = i % w; const y = (i - x) / w;
      return (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
    };
    // 1) trim the light fringe left by anti-aliasing
    const trim = [];
    for (let i = 0; i < N; i++) {
      if (!bg[i] && touchesBg(i) && Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) >= 190) trim.push(i);
    }
    trim.forEach((i) => { bg[i] = 1; });
    // 2) soften the new edge so it isn't jagged
    const soft = [];
    for (let i = 0; i < N; i++) if (!bg[i] && touchesBg(i)) soft.push(i);
    for (let i = 0; i < N; i++) if (bg[i]) d[i * 4 + 3] = 0;
    soft.forEach((i) => { d[i * 4 + 3] = 170; });
    ctx.putImageData(imageData, 0, 0);
  }

  // find the artwork and centre it on a square canvas with a little breathing room
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (d[(y * w + x) * 4 + 3] > 20) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  if (maxX < 0) throw new Error('Could not find a logo in that image — is it completely white?');
  const cw = maxX - minX + 1; const ch = maxY - minY + 1;
  const side = Math.round(Math.max(cw, ch) * 1.06);
  const out = document.createElement('canvas');
  out.width = side; out.height = side;
  out.getContext('2d').drawImage(canvas, minX, minY, cw, ch, Math.round((side - cw) / 2), Math.round((side - ch) / 2), cw, ch);
  return toPngBlob(out);
}
