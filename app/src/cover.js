// Solmar Cover Studio: the cover engine.
// Draws the multi-panel poster cover onto any 2D canvas: panels with
// per-panel crop (pan + zoom), a colour grade, grain, vignette, and the
// bold caption lettering. Everything here is original art and lettering:
// no Rockstar logo, artwork, character or font file anywhere.

export const EXPORT_SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080 (square post)' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350 (portrait post)' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080 (landscape post)' },
};

export const LAYOUTS = {
  grid: { label: 'Vice Grid', hint: 'Hero panel on top, three panels below' },
  split: { label: 'Split', hint: 'Big panel left, two stacked right, one tilted snapshot' },
  poster: { label: 'Poster', hint: 'Full-bleed hero, inset snapshots at the foot' },
};

export const PRESETS = {
  sunset: {
    label: 'Vice Sunset',
    band: '#160a24',
    accent: '#ff7a18',
    accent2: '#ff2e88',
    titleShadow: '#ff2e88',
    subtitle: '#ffd76a',
    washTop: 'rgba(255, 122, 24, 0.10)',
    washBottom: 'rgba(255, 46, 136, 0.34)',
    overlay: 'rgba(255, 110, 60, 0.16)',
    scrim: 'rgba(22, 10, 36, 0.72)',
  },
  neon: {
    label: 'Neon Nights',
    band: '#070312',
    accent: '#00f0ff',
    accent2: '#ff2e88',
    titleShadow: '#00f0ff',
    subtitle: '#7cff6b',
    washTop: 'rgba(0, 240, 255, 0.08)',
    washBottom: 'rgba(255, 46, 136, 0.38)',
    overlay: 'rgba(120, 40, 255, 0.20)',
    scrim: 'rgba(7, 3, 18, 0.78)',
  },
  ocean: {
    label: 'Ocean Drive',
    band: '#062a33',
    accent: '#ffc46b',
    accent2: '#2fa8a0',
    titleShadow: '#2fa8a0',
    subtitle: '#fff3c4',
    washTop: 'rgba(255, 196, 107, 0.10)',
    washBottom: 'rgba(47, 168, 160, 0.30)',
    overlay: 'rgba(47, 168, 160, 0.14)',
    scrim: 'rgba(6, 42, 51, 0.72)',
  },
};

/** Default crop for a panel: zoom 1 and no pan. */
export function defaultPanelCrop() {
  return { zoom: 1, ox: 0, oy: 0 };
}

/**
 * Panel rectangles for a layout, in canvas pixels.
 * Returns { panels: [rect x4], title: rect|null, tilted: index of the
 * snapshot panel drawn tilted on top, insets: bool }.
 * A rect is { x, y, w, h }. The title band sits at the foot for grid/split;
 * poster carries its title over the hero instead.
 */
export function computeLayout(w, h, layout) {
  const g = Math.max(6, Math.round(Math.min(w, h) * 0.008));
  const bandH = Math.round(h * 0.17);
  const photoH = h - bandH;
  if (layout === 'split') {
    const leftW = Math.round(w * 0.58);
    const rightX = leftW + g;
    const rightW = w - rightX;
    const halfH = Math.round((photoH - g) / 2);
    return {
      panels: [
        { x: 0, y: 0, w: leftW, h: photoH },
        { x: rightX, y: 0, w: rightW, h: halfH },
        { x: rightX, y: halfH + g, w: rightW, h: photoH - halfH - g },
        { x: Math.round(w * 0.42), y: Math.round(photoH * 0.42), w: Math.round(w * 0.3), h: Math.round(photoH * 0.34) },
      ],
      title: { x: 0, y: photoH, w, h: bandH },
      tilted: 3,
      gutter: g,
    };
  }
  if (layout === 'poster') {
    const insetW = Math.round(w * 0.3);
    const insetH = Math.round(h * 0.2);
    const insetY = h - insetH - Math.round(h * 0.03);
    return {
      panels: [
        { x: 0, y: 0, w, h },
        { x: Math.round(w * 0.03), y: insetY, w: insetW, h: insetH },
        { x: Math.round(w * 0.67), y: insetY, w: insetW, h: insetH },
        { x: Math.round(w * 0.36), y: insetY, w: Math.round(w * 0.28), h: insetH },
      ],
      title: null,
      tilted: 3,
      gutter: g,
    };
  }
  const heroH = Math.round(photoH * 0.6);
  const rowY = heroH + g;
  const rowH = photoH - heroH - g;
  const cellW = Math.round((w - g * 2) / 3);
  return {
    panels: [
      { x: 0, y: 0, w, h: heroH },
      { x: 0, y: rowY, w: cellW, h: rowH },
      { x: cellW + g, y: rowY, w: cellW, h: rowH },
      { x: cellW * 2 + g * 2, y: rowY, w: w - cellW * 2 - g * 2, h: rowH },
    ],
    title: { x: 0, y: photoH, w, h: bandH },
    tilted: -1,
    gutter: g,
  };
}

/** Draws one image (or demo canvas) into a panel rect, cover-fit, with pan/zoom. */
export function drawPanelImage(ctx, image, rect, crop) {
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  if (!iw || !ih) return;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * (crop.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const maxOx = Math.max(0, (dw - rect.w) / 2 / rect.w);
  const maxOy = Math.max(0, (dh - rect.h) / 2 / rect.h);
  const ox = Math.max(-maxOx, Math.min(maxOx, crop.ox || 0));
  const oy = Math.max(-maxOy, Math.min(maxOy, crop.oy || 0));
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.restore();
}

/** An empty panel: diagonal sunset stripes and a "your photo" note. */
export function drawEmptyPanel(ctx, rect, preset) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, '#3b1d6e');
  grad.addColorStop(0.5, '#c22e7a');
  grad.addColorStop(1, '#ff7a18');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = Math.max(2, rect.w * 0.01);
  for (let i = -2; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(rect.x + i * rect.w * 0.25, rect.y + rect.h);
    ctx.lineTo(rect.x + i * rect.w * 0.25 + rect.w * 0.4, rect.y);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `700 ${Math.max(13, rect.w * 0.055)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('YOUR PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.restore();
}

/** Fits the title to the width, shrinking until it fits. */
export function fitTitleFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size = Math.max(14, size - 2);
    ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  }
  return size;
}

/** The caption block: eyebrow, big title, script-style subtitle. */
export function drawCaptionBlock(ctx, box, title, subtitle, preset, w, h) {
  const cx = box.x + box.w / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const eyebrowSize = Math.max(11, Math.round(Math.min(w, h) * 0.013));
  ctx.font = `700 ${eyebrowSize}px system-ui, sans-serif`;
  ctx.fillStyle = preset.accent;
  try { ctx.letterSpacing = `${Math.round(eyebrowSize * 0.35)}px`; } catch { /* older canvas: no letterSpacing */ }
  ctx.fillText('S O L M A R   B A Y', cx, box.y + box.h * 0.13);
  try { ctx.letterSpacing = '0px'; } catch { /* reset */ }
  const text = (title || 'SOLMAR HEAT').trim().toUpperCase();
  const startSize = Math.round(Math.min(w * 0.075, box.h * 0.5));
  const titleSize = fitTitleFont(ctx, text, box.w * 0.9, startSize);
  const titleY = box.y + box.h * 0.5;
  ctx.save();
  ctx.shadowColor = preset.titleShadow;
  ctx.shadowBlur = Math.round(w * 0.012);
  ctx.shadowOffsetX = Math.round(w * 0.004);
  ctx.shadowOffsetY = Math.round(w * 0.004);
  ctx.lineWidth = Math.max(2, titleSize * 0.09);
  ctx.strokeStyle = 'rgba(10, 4, 20, 0.9)';
  ctx.strokeText(text, cx, titleY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, cx, titleY);
  ctx.restore();
  const sub = (subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(13, Math.round(Math.min(w, h) * 0.022));
    ctx.font = `italic 600 ${subSize}px Georgia, "Times New Roman", serif`;
    ctx.fillStyle = preset.subtitle;
    ctx.shadowColor = preset.accent2;
    ctx.shadowBlur = Math.round(w * 0.01);
    ctx.fillText(sub, cx, box.y + box.h * 0.83);
    ctx.shadowBlur = 0;
  }
}

/** Deterministic film grain: seeded speckles over the whole cover. */
export function drawGrain(ctx, w, h) {
  let a = 1234567;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  ctx.save();
  const count = Math.round((w * h) / 900);
  for (let i = 0; i < count; i++) {
    const v = next();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(next() * w, next() * h, 1.6, 1.6);
  }
  ctx.restore();
}

/** Vignette: darkened corners so the middle pops. */
export function drawVignette(ctx, w, h) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(5,0,15,0.38)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Halftone dots along the top edge of the title band. */
export function drawHalftoneStrip(ctx, x, y, w, preset) {
  const r = Math.max(2, w * 0.0035);
  const step = r * 3.4;
  ctx.fillStyle = preset.accent;
  for (let px = x + step; px < x + w - step; px += step) {
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(px, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Draws the whole cover.
 * state: { images: [img|null x4], crops: [{zoom,ox,oy} x4], layout, preset,
 *          title, subtitle }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const preset = PRESETS[state.preset] || PRESETS.sunset;
  const layout = computeLayout(w, h, state.layout || 'grid');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const tiltedIndex = layout.tilted;
  const isPoster = layout.title === null;
  layout.panels.forEach((rect, i) => {
    if (i === tiltedIndex) return;
    const image = state.images[i];
    if (image) drawPanelImage(ctx, image, rect, state.crops[i] || defaultPanelCrop());
    else drawEmptyPanel(ctx, rect, preset);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = layout.gutter;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    if (isPoster && i === 0) {
      const insetBand = ctx.createLinearGradient(0, h * 0.72, 0, h);
      insetBand.addColorStop(0, 'rgba(0,0,0,0)');
      insetBand.addColorStop(1, 'rgba(5,0,15,0.5)');
      ctx.fillStyle = insetBand;
      ctx.fillRect(0, h * 0.72, w, h * 0.28);
    }
  });
  if (tiltedIndex >= 0) {
    const rect = layout.panels[tiltedIndex];
    const image = state.images[tiltedIndex];
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(-0.07);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = Math.round(w * 0.02);
    ctx.shadowOffsetY = Math.round(w * 0.008);
    const inner = { x: -rect.w / 2, y: -rect.h / 2, w: rect.w, h: rect.h };
    ctx.fillStyle = '#ffffff';
    const border = Math.max(5, Math.round(w * 0.008));
    ctx.fillRect(inner.x - border, inner.y - border, inner.w + border * 2, inner.h + border * 2);
    if (image) drawPanelImage(ctx, image, inner, state.crops[tiltedIndex] || defaultPanelCrop());
    else drawEmptyPanel(ctx, inner, preset);
    ctx.restore();
  }
  if (layout.title) {
    const band = layout.title;
    ctx.fillStyle = preset.band;
    ctx.fillRect(band.x, band.y, band.w, band.h);
    const stripe = ctx.createLinearGradient(band.x, 0, band.x + band.w, 0);
    stripe.addColorStop(0, preset.accent);
    stripe.addColorStop(0.5, preset.accent2);
    stripe.addColorStop(1, preset.accent);
    ctx.fillStyle = stripe;
    ctx.fillRect(band.x, band.y, band.w, Math.max(3, Math.round(h * 0.006)));
    drawHalftoneStrip(ctx, band.x, band.y + band.h * 0.08, band.w, preset);
    drawCaptionBlock(ctx, { x: band.x, y: band.y + band.h * 0.1, w: band.w, h: band.h * 0.9 }, state.title, state.subtitle, preset, w, h);
  } else {
    const scrim = ctx.createLinearGradient(0, 0, 0, h * 0.34);
    scrim.addColorStop(0, preset.scrim);
    scrim.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, h * 0.34);
    drawCaptionBlock(ctx, { x: w * 0.06, y: h * 0.03, w: w * 0.88, h: h * 0.24 }, state.title, state.subtitle, preset, w, h);
  }
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, preset.washTop);
  wash.addColorStop(1, preset.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = preset.overlay;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  drawVignette(ctx, w, h);
  drawGrain(ctx, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(3, Math.round(w * 0.004));
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}

/** Renders the cover at an export size and returns the canvas. */
export function renderCover(state, sizeKey) {
  const size = EXPORT_SIZES[sizeKey] || EXPORT_SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  return canvas;
}
