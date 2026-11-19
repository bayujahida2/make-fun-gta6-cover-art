// Procedural demo photos for Solmar Cover Studio.
// Every scene is drawn in code on a canvas with a seeded generator, so the
// same seed always paints the same picture. No downloaded images, no photos
// of real people, nothing borrowed: the app works with user uploads, and
// these four scenes exist only so a first-time user sees a finished cover
// before picking their own photos.

/** Deterministic PRNG (mulberry32): same seed, same picture, every run. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A palm tree silhouette: curved trunk, drooping fronds, coconuts. */
export function drawPalm(ctx, x, y, s, lean, color, rng) {
  const topX = x + lean * s;
  const topY = y - s;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(3, s * 0.055);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * s * 0.3, y - s * 0.55, topX, topY);
  ctx.stroke();
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const a = (-Math.PI * 0.08) - (i / (fronds - 1)) * Math.PI * 0.84 + (rng() - 0.5) * 0.12;
    const len = s * (0.42 + rng() * 0.22);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + len * 0.28;
    ctx.lineWidth = Math.max(2, s * 0.035);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.6, topY - len * 0.18, ex, ey);
    ctx.stroke();
  }
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(topX + (rng() - 0.5) * s * 0.1, topY + s * 0.03 + rng() * s * 0.03, Math.max(2, s * 0.025), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A few distant birds: two short arcs each. */
export function drawBirds(ctx, w, h, n, color, rng) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, w * 0.003);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = w * (0.1 + rng() * 0.8);
    const y = h * (0.08 + rng() * 0.22);
    const s = w * (0.012 + rng() * 0.012);
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.7, x, y);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.7, x + s, y);
    ctx.stroke();
  }
}

/** Soft horizontal cloud bands. */
export function drawClouds(ctx, w, h, n, color, alpha, rng) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const x = w * rng();
    const y = h * (0.06 + rng() * 0.3);
    const cw = w * (0.12 + rng() * 0.22);
    const ch = cw * 0.16;
    ctx.globalAlpha = alpha * (0.5 + rng() * 0.5);
    ctx.beginPath();
    ctx.ellipse(x, y, cw / 2, ch / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + cw * 0.2, y + ch * 0.25, cw * 0.28, ch * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Sunset beach: orange-pink sky, low sun, sea shimmer, sand, palms. */
export function drawBeachScene(ctx, w, h, seed) {
  const rng = seededRandom(seed);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, '#3b1d6e');
  sky.addColorStop(0.35, '#c22e7a');
  sky.addColorStop(0.7, '#ff6a3d');
  sky.addColorStop(1, '#ffb347');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.62);
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.52, 4, w * 0.5, h * 0.52, w * 0.34);
  glow.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
  glow.addColorStop(0.25, 'rgba(255, 170, 90, 0.55)');
  glow.addColorStop(1, 'rgba(255, 120, 60, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h * 0.66);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.52, w * 0.085, 0, Math.PI * 2);
  ctx.fill();
  drawClouds(ctx, w, h, 5, '#ffd9e8', 0.5, rng);
  drawBirds(ctx, w, h, 5, '#2a1145', rng);
  const sea = ctx.createLinearGradient(0, h * 0.58, 0, h * 0.78);
  sea.addColorStop(0, '#ff8a5c');
  sea.addColorStop(0.5, '#b83a6e');
  sea.addColorStop(1, '#5b2a72');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.58, w, h * 0.2);
  ctx.strokeStyle = 'rgba(255, 220, 160, 0.5)';
  for (let i = 0; i < 26; i++) {
    const y = h * (0.59 + rng() * 0.17);
    const x = w * (0.5 + (rng() - 0.5) * (0.15 + Math.abs(y - h * 0.68) * 1.4));
    const len = w * (0.02 + rng() * 0.06);
    ctx.lineWidth = 1 + rng() * 2;
    ctx.globalAlpha = 0.25 + rng() * 0.45;
    ctx.beginPath();
    ctx.moveTo(x - len / 2, y);
    ctx.lineTo(x + len / 2, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const sand = ctx.createLinearGradient(0, h * 0.78, 0, h);
  sand.addColorStop(0, '#e8a06a');
  sand.addColorStop(1, '#8a4a5e');
  ctx.fillStyle = sand;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  ctx.strokeStyle = 'rgba(90, 30, 60, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.78);
  ctx.bezierCurveTo(w * 0.3, h * 0.76, w * 0.6, h * 0.8, w, h * 0.775);
  ctx.stroke();
  drawPalm(ctx, w * 0.12, h * 0.98, h * 0.42, 0.22, '#241031', rng);
  drawPalm(ctx, w * 0.88, h * 0.99, h * 0.36, -0.18, '#1d0c28', rng);
  drawPalm(ctx, w * 0.7, h * 0.86, h * 0.2, 0.12, '#2c123c', rng);
}

/** Neon boulevard at dusk: dark towers, glowing signs, wet-road reflections. */
export function drawBoulevardScene(ctx, w, h, seed) {
  const rng = seededRandom(seed);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  sky.addColorStop(0, '#0d0620');
  sky.addColorStop(0.55, '#3a1150');
  sky.addColorStop(1, '#ff2e88');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.55);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 60; i++) {
    ctx.globalAlpha = 0.25 + rng() * 0.6;
    ctx.fillRect(rng() * w, rng() * h * 0.4, 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.12, w * 0.045, 0, Math.PI * 2);
  ctx.fill();
  const neons = ['#00f0ff', '#ff2e88', '#ffe14d', '#7cff6b', '#ff7a18'];
  let x = 0;
  while (x < w) {
    const bw = w * (0.1 + rng() * 0.14);
    const bh = h * (0.28 + rng() * 0.3);
    const by = h * 0.62 - bh;
    ctx.fillStyle = rng() > 0.5 ? '#150a2e' : '#1d0f3d';
    ctx.fillRect(x, by, bw, bh);
    for (let wy = by + h * 0.03; wy < h * 0.58; wy += h * 0.045) {
      for (let wx = x + bw * 0.12; wx < x + bw * 0.88; wx += bw * 0.24) {
        if (rng() > 0.45) {
          ctx.fillStyle = rng() > 0.6 ? '#ffd76a' : '#8ef6ff';
          ctx.globalAlpha = 0.55 + rng() * 0.45;
          ctx.fillRect(wx, wy, bw * 0.12, h * 0.02);
        }
      }
    }
    ctx.globalAlpha = 1;
    if (rng() > 0.35) {
      const signColor = neons[Math.floor(rng() * neons.length)];
      const sw = bw * (0.6 + rng() * 0.3);
      const sh = h * (0.05 + rng() * 0.03);
      const sx = x + (bw - sw) / 2;
      const sy = by + h * (0.04 + rng() * 0.12);
      ctx.save();
      ctx.shadowColor = signColor;
      ctx.shadowBlur = w * 0.03;
      ctx.fillStyle = signColor;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(sx + sw * 0.08, sy + sh * 0.3, sw * 0.84, sh * 0.16);
      ctx.fillRect(sx + sw * 0.08, sy + sh * 0.58, sw * 0.5, sh * 0.14);
      ctx.restore();
    }
    x += bw + w * 0.008;
  }
  const road = ctx.createLinearGradient(0, h * 0.62, 0, h);
  road.addColorStop(0, '#241238');
  road.addColorStop(1, '#0a0616');
  ctx.fillStyle = road;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  for (let i = 0; i < 34; i++) {
    const c = neons[Math.floor(rng() * neons.length)];
    ctx.strokeStyle = c;
    ctx.globalAlpha = 0.14 + rng() * 0.3;
    ctx.lineWidth = 2 + rng() * 4;
    const rx = w * rng();
    const ry = h * (0.64 + rng() * 0.3);
    const len = w * (0.03 + rng() * 0.09);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + (rng() - 0.5) * len * 0.4, ry + h * (0.01 + rng() * 0.05));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f7e9a0';
  ctx.fillRect(0, h * 0.795, w, h * 0.008);
  drawPalm(ctx, w * 0.06, h * 0.66, h * 0.24, 0.14, '#0a0518', rng);
  drawPalm(ctx, w * 0.94, h * 0.67, h * 0.2, -0.12, '#0a0518', rng);
}

/** Palm skyline at blue hour: layered towers, gold windows, low sun band. */
export function drawSkylineScene(ctx, w, h, seed) {
  const rng = seededRandom(seed);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0a2a5e');
  sky.addColorStop(0.45, '#274b8f');
  sky.addColorStop(0.72, '#ff9a5c');
  sky.addColorStop(1, '#ffc46b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath();
  ctx.arc(w * 0.24, h * 0.6, w * 0.05, 0, Math.PI * 2);
  ctx.fill();
  const sunGlow = ctx.createRadialGradient(w * 0.24, h * 0.6, 4, w * 0.24, h * 0.6, w * 0.3);
  sunGlow.addColorStop(0, 'rgba(255, 220, 140, 0.6)');
  sunGlow.addColorStop(1, 'rgba(255, 180, 90, 0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, w, h);
  drawClouds(ctx, w, h, 4, '#ffe3c2', 0.4, rng);
  drawBirds(ctx, w, h, 4, '#10244a', rng);
  const layers = [
    { base: h * 0.66, color: '#5a4a8a', min: 0.1, max: 0.22 },
    { base: h * 0.74, color: '#2c2352', min: 0.16, max: 0.32 },
    { base: h * 0.86, color: '#120d2e', min: 0.22, max: 0.42 },
  ];
  for (const layer of layers) {
    let x = -w * 0.02;
    while (x < w) {
      const bw = w * (0.07 + rng() * 0.09);
      const bh = h * (layer.min + rng() * (layer.max - layer.min));
      const by = layer.base - bh;
      ctx.fillStyle = layer.color;
      ctx.fillRect(x, by, bw, bh + h);
      if (rng() > 0.6) {
        ctx.beginPath();
        ctx.moveTo(x, by);
        ctx.lineTo(x + bw / 2, by - h * 0.03);
        ctx.lineTo(x + bw, by);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd76a';
      for (let wy = by + h * 0.025; wy < layer.base - h * 0.02; wy += h * 0.04) {
        for (let wx = x + bw * 0.14; wx < x + bw * 0.86; wx += bw * 0.26) {
          if (rng() > 0.55) {
            ctx.globalAlpha = 0.5 + rng() * 0.5;
            ctx.fillRect(wx, wy, bw * 0.12, h * 0.018);
          }
        }
      }
      ctx.globalAlpha = 1;
      x += bw + w * 0.012;
    }
  }
  const ground = ctx.createLinearGradient(0, h * 0.86, 0, h);
  ground.addColorStop(0, '#1a1440');
  ground.addColorStop(1, '#0a0820');
  ctx.fillStyle = ground;
  ctx.fillRect(0, h * 0.86, w, h * 0.14);
  drawPalm(ctx, w * 0.1, h * 0.99, h * 0.3, 0.2, '#070418', rng);
  drawPalm(ctx, w * 0.9, h * 0.99, h * 0.26, -0.16, '#070418', rng);
}

/** Pier at sunset: peach sky, glittering sea, wooden pier in perspective. */
export function drawPierScene(ctx, w, h, seed) {
  const rng = seededRandom(seed);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  sky.addColorStop(0, '#7a2d8f');
  sky.addColorStop(0.5, '#ff5e7a');
  sky.addColorStop(1, '#ffb347');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.55);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(w * 0.62, h * 0.42, w * 0.075, 0, Math.PI * 2);
  ctx.fill();
  const glow = ctx.createRadialGradient(w * 0.62, h * 0.42, 4, w * 0.62, h * 0.42, w * 0.32);
  glow.addColorStop(0, 'rgba(255, 230, 160, 0.7)');
  glow.addColorStop(1, 'rgba(255, 150, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h * 0.6);
  drawClouds(ctx, w, h, 5, '#ffd9e8', 0.55, rng);
  drawBirds(ctx, w, h, 4, '#33124a', rng);
  const sea = ctx.createLinearGradient(0, h * 0.5, 0, h);
  sea.addColorStop(0, '#ff9a6b');
  sea.addColorStop(0.35, '#2fa8a0');
  sea.addColorStop(1, '#0b5e7a');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.5, w, h * 0.5);
  for (let i = 0; i < 40; i++) {
    const y = h * (0.52 + rng() * 0.44);
    const spread = 0.06 + (y - h * 0.5) / h * 0.9;
    const x = w * (0.62 + (rng() - 0.5) * spread);
    ctx.strokeStyle = 'rgba(255, 240, 190, 0.55)';
    ctx.lineWidth = 1 + rng() * 2;
    ctx.globalAlpha = 0.3 + rng() * 0.5;
    const len = w * (0.015 + rng() * 0.05);
    ctx.beginPath();
    ctx.moveTo(x - len / 2, y);
    ctx.lineTo(x + len / 2, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    const y = h * (0.54 + rng() * 0.4);
    ctx.beginPath();
    ctx.moveTo(w * rng() * 0.4, y);
    ctx.lineTo(w * (0.5 + rng() * 0.5), y + (rng() - 0.5) * 4);
    ctx.stroke();
  }
  const pierColor = '#5d3a24';
  const pierDark = '#3f2718';
  const vanishingX = w * 0.5;
  const vanishingY = h * 0.52;
  const baseLeft = w * 0.18;
  const baseRight = w * 0.82;
  ctx.fillStyle = pierColor;
  ctx.beginPath();
  ctx.moveTo(vanishingX - w * 0.02, vanishingY);
  ctx.lineTo(vanishingX + w * 0.02, vanishingY);
  ctx.lineTo(baseRight, h);
  ctx.lineTo(baseLeft, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = pierDark;
  ctx.lineWidth = 3;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const y = vanishingY + (h - vanishingY) * t * t;
    const lx = vanishingX - w * 0.02 + (baseLeft - (vanishingX - w * 0.02)) * t;
    const rx = vanishingX + w * 0.02 + (baseRight - (vanishingX + w * 0.02)) * t;
    ctx.beginPath();
    ctx.moveTo(lx, y);
    ctx.lineTo(rx, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(63, 39, 24, 0.8)';
  ctx.lineWidth = 2;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(vanishingX + side * w * 0.02, vanishingY);
    ctx.lineTo(side < 0 ? baseLeft : baseRight, h);
    ctx.stroke();
  }
  ctx.fillStyle = pierDark;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const t = 0.25 + i * 0.25;
      const y = vanishingY + (h - vanishingY) * t * t;
      const px = vanishingX + side * (w * 0.02 + (w * 0.32 - w * 0.02) * t);
      const postH = h * 0.03 * (0.5 + t);
      ctx.fillRect(px - 4, y - postH, 8, postH + h * 0.02);
    }
  }
  drawPalm(ctx, w * 0.06, h * 0.62, h * 0.18, 0.1, '#2c123c', rng);
}

export const DEMO_SCENES = [
  { id: 'beach', name: 'Sunset beach', draw: drawBeachScene, seed: 101 },
  { id: 'boulevard', name: 'Neon boulevard', draw: drawBoulevardScene, seed: 202 },
  { id: 'skyline', name: 'Palm skyline', draw: drawSkylineScene, seed: 303 },
  { id: 'pier', name: 'Pier at sunset', draw: drawPierScene, seed: 404 },
];

/** Paints all four demo scenes onto canvases and returns them. */
export function makeDemoPhotos(size = 900) {
  return DEMO_SCENES.map((scene) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    scene.draw(canvas.getContext('2d'), size, size, scene.seed);
    return canvas;
  });
}
