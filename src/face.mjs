const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function spanAt(face, sy) {
  const {rows, step} = face;
  const f = clamp(sy / step - 0.5, 0, rows.length - 1);
  const i = Math.floor(f), j = Math.min(rows.length - 1, i + 1), t = f - i;
  return [rows[i][0] * (1 - t) + rows[j][0] * t, rows[i][1] * (1 - t) + rows[j][1] * t];
}

export function faceSize(face) {
  return {w: face.w, h: face.chin};
}

export function bladeSize(face, k) {
  return {w: face.w, h: Math.round((face.h - face.chin) * k)};
}

export function facePolygon(face, stepPx = 2) {
  const h = face.chin, left = [], right = [];
  for (let y = 0; ; y += stepPx) {
    const yy = Math.min(y, h);
    const [l, r] = spanAt(face, Math.min(face.h - 0.5, yy));
    left.push([l, yy]); right.push([r, yy]);
    if (yy === h) break;
  }
  return left.concat(right.reverse());
}

export function bladePolygon(face, k, stepPx = 2) {
  const {h} = bladeSize(face, k), left = [], right = [];
  for (let y = 0; y <= h; y += stepPx) {
    const [l, r] = spanAt(face, Math.min(face.h - 0.5, face.chin + y / k));
    left.push([l, y]); right.push([r, y]);
  }
  return left.concat(right.reverse());
}

function trace(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

export function drawFace(ctx, img, face) {
  const s = img.width / face.w;
  ctx.imageSmoothingQuality = 'high';
  ctx.save();
  trace(ctx, facePolygon(face));
  ctx.clip();
  ctx.drawImage(img, 0, 0, img.width, face.chin * s, 0, 0, face.w, face.chin);
  ctx.restore();
}

export function drawBlade(ctx, img, face, k) {
  const s = img.width / face.w, size = bladeSize(face, k);
  ctx.imageSmoothingQuality = 'high';
  ctx.save();
  ctx.translate(0, size.h);
  ctx.scale(1, -1);
  trace(ctx, bladePolygon(face, k));
  ctx.clip();
  ctx.drawImage(img, 0, face.chin * s, img.width, (face.h - face.chin) * s, 0, 0, face.w, size.h);
  ctx.restore();
}
