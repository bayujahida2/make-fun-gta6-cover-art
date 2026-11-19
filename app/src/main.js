// Solmar Cover Studio: the editor.
// Wires the page: photo uploads per panel, drag to pan and zoom to crop,
// caption editing, layout and style presets, and PNG export in the three
// common post sizes. Photos are read on the user's own machine and never
// uploaded anywhere. A `?shot=` query sets up a fixed scene for a
// screenshot instead (./shots.js).

import { drawCover, renderCover, computeLayout, defaultPanelCrop, EXPORT_SIZES, LAYOUTS, PRESETS } from './cover.js';
import { makeDemoPhotos } from './demo.js';
import { runShot } from './shots.js';

const preview = document.getElementById('preview');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const statusEl = document.getElementById('status');
const sizeSelect = document.getElementById('size');
const zoomSlider = document.getElementById('zoom');
const zoomValue = document.getElementById('zoomValue');
const selectedLabel = document.getElementById('selectedLabel');

const PANEL_NAMES = ['Hero panel', 'Panel 2', 'Panel 3', 'Panel 4'];

const state = {
  images: [null, null, null, null],
  crops: [defaultPanelCrop(), defaultPanelCrop(), defaultPanelCrop(), defaultPanelCrop()],
  layout: 'grid',
  preset: 'sunset',
  size: 'square',
  title: 'Solmar Heat',
  subtitle: 'one night in solmar bay',
  selected: 0,
};

function setStatus(text) {
  statusEl.textContent = text;
}

/** Sizes the preview canvas to the chosen export aspect and repaints. */
export function renderPreview() {
  const size = EXPORT_SIZES[state.size];
  const coverShot = document.body.classList.contains('shot-cover');
  const cap = coverShot ? Math.max(size.w, size.h) : 760;
  const scale = Math.min(cap / size.w, cap / size.h, 1);
  preview.width = Math.round(size.w * scale);
  preview.height = Math.round(size.h * scale);
  drawCover(preview, state);
  preview.dataset.layout = state.layout;
  preview.dataset.preset = state.preset;
}

/** Loads an image file (or demo canvas) into a panel. */
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Fills every panel with the demo scenes, each with its own crop. */
export function loadDemoPhotos() {
  const demos = makeDemoPhotos(900);
  const crops = [
    { zoom: 1.05, ox: 0, oy: 0.02 },
    { zoom: 1.25, ox: -0.06, oy: 0 },
    { zoom: 1.2, ox: 0.05, oy: -0.02 },
    { zoom: 1.3, ox: 0, oy: 0.05 },
  ];
  state.images = demos;
  state.crops = crops;
  renderPreview();
  setStatus('Demo photos loaded. Swap any panel with your own photo.');
}

/** Fills all four panels from files: one file repeats with varied crops. */
export async function fillAllPanels(files) {
  const list = Array.from(files || []);
  if (!list.length) return;
  if (list.length === 1) {
    const img = await loadImageFile(list[0]);
    const crops = [
      { zoom: 1.0, ox: 0, oy: 0 },
      { zoom: 1.6, ox: -0.12, oy: -0.08 },
      { zoom: 1.6, ox: 0.12, oy: 0.06 },
      { zoom: 1.9, ox: 0, oy: -0.1 },
    ];
    state.images = [img, img, img, img];
    state.crops = crops;
  } else {
    for (let i = 0; i < 4 && i < list.length; i++) {
      state.images[i] = await loadImageFile(list[i]);
      state.crops[i] = defaultPanelCrop();
    }
  }
  renderPreview();
  setStatus(list.length === 1 ? 'One photo fills all four panels.' : `${Math.min(4, list.length)} photos placed.`);
}

export function selectPanel(index) {
  state.selected = index;
  selectedLabel.textContent = `${PANEL_NAMES[index]} selected — drag it on the cover to pan, use the zoom slider to crop.`;
  document.querySelectorAll('.panel-card').forEach((card, i) => {
    card.classList.toggle('selected', i === index);
  });
  const crop = state.crops[index];
  zoomSlider.value = String(crop.zoom);
  zoomValue.textContent = `${Math.round(crop.zoom * 100)}%`;
}

function bindPanelCards() {
  document.querySelectorAll('.panel-card').forEach((card) => {
    const index = Number(card.dataset.panel);
    card.querySelector('.select-panel').addEventListener('click', () => selectPanel(index));
    card.querySelector('.panel-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      state.images[index] = await loadImageFile(file);
      state.crops[index] = defaultPanelCrop();
      selectPanel(index);
      renderPreview();
      setStatus(`${PANEL_NAMES[index]} updated.`);
    });
    card.querySelector('.panel-reset').addEventListener('click', () => {
      state.crops[index] = defaultPanelCrop();
      selectPanel(index);
      renderPreview();
      setStatus(`${PANEL_NAMES[index]} crop reset.`);
    });
  });
}

function bindControls() {
  document.getElementById('demoBtn').addEventListener('click', loadDemoPhotos);
  document.getElementById('fillAll').addEventListener('change', (e) => {
    fillAllPanels(e.target.files).catch(() => setStatus('That file could not be read as a photo.'));
    e.target.value = '';
  });
  titleInput.addEventListener('input', () => { state.title = titleInput.value; renderPreview(); });
  subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; renderPreview(); });
  document.querySelectorAll('.layout-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.layout = btn.dataset.layout;
      document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('active', b === btn));
      document.getElementById('layoutHint').textContent = LAYOUTS[state.layout].hint;
      renderPreview();
    });
  });
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.preset = btn.dataset.preset;
      document.querySelectorAll('.preset-btn').forEach((b) => b.classList.toggle('active', b === btn));
      renderPreview();
    });
  });
  sizeSelect.addEventListener('change', () => { state.size = sizeSelect.value; renderPreview(); });
  zoomSlider.addEventListener('input', () => {
    state.crops[state.selected].zoom = Number(zoomSlider.value);
    zoomValue.textContent = `${Math.round(Number(zoomSlider.value) * 100)}%`;
    renderPreview();
  });
  document.getElementById('resetCrop').addEventListener('click', () => {
    state.crops[state.selected] = defaultPanelCrop();
    selectPanel(state.selected);
    renderPreview();
  });
  document.getElementById('exportBtn').addEventListener('click', exportCover);
}

/** Exports the cover at the chosen size as a PNG download. */
export function exportCover() {
  const size = EXPORT_SIZES[state.size];
  const canvas = renderCover(state, state.size);
  window.__lastExport = { w: size.w, h: size.h, size: state.size };
  canvas.toBlob((blob) => {
    if (!blob) { setStatus('Export failed in this browser.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `solmar-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved solmar-cover-${size.w}x${size.h}.png (${size.w} x ${size.h}).`);
  }, 'image/png');
}

/** Drag-to-pan on the preview canvas, and click-to-select a panel. */
function bindPreviewDrag() {
  let drag = null;
  const toCanvas = (e) => {
    const rect = preview.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * preview.width,
      y: ((e.clientY - rect.top) / rect.height) * preview.height,
    };
  };
  const hitPanel = (point) => {
    const layout = computeLayout(preview.width, preview.height, state.layout);
    const order = layout.tilted >= 0 ? [...layout.panels.keys()].reverse() : [0, 1, 2, 3];
    for (const i of order) {
      const r = layout.panels[i];
      if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) return i;
    }
    return -1;
  };
  preview.addEventListener('pointerdown', (e) => {
    const point = toCanvas(e);
    const hit = hitPanel(point);
    if (hit < 0) return;
    selectPanel(hit);
    drag = { x: point.x, y: point.y, index: hit };
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const point = toCanvas(e);
    const layout = computeLayout(preview.width, preview.height, state.layout);
    const rect = layout.panels[drag.index];
    const crop = state.crops[drag.index];
    crop.ox += (point.x - drag.x) / rect.w;
    crop.oy += (point.y - drag.y) / rect.h;
    drag = { x: point.x, y: point.y, index: drag.index };
    renderPreview();
  });
  const endDrag = () => { drag = null; };
  preview.addEventListener('pointerup', endDrag);
  preview.addEventListener('pointercancel', endDrag);
}

/** Public handle for screenshots and tests: drive the app from outside. */
window.__solmar = {
  state,
  renderPreview,
  loadDemoPhotos,
  exportCover,
  selectPanel,
  setTitle(text) { state.title = text; titleInput.value = text; renderPreview(); },
  setSubtitle(text) { state.subtitle = text; subtitleInput.value = text; renderPreview(); },
  setLayout(layout) {
    state.layout = layout;
    document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('active', b.dataset.layout === layout));
    document.getElementById('layoutHint').textContent = LAYOUTS[layout].hint;
    renderPreview();
  },
  setPreset(preset) {
    state.preset = preset;
    document.querySelectorAll('.preset-btn').forEach((b) => b.classList.toggle('active', b.dataset.preset === preset));
    renderPreview();
  },
  setSize(size) { state.size = size; sizeSelect.value = size; renderPreview(); },
  setPanelFromDataURL(index, dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        state.images[index] = img;
        state.crops[index] = defaultPanelCrop();
        renderPreview();
        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  },
};

bindPanelCards();
bindControls();
bindPreviewDrag();
selectPanel(0);

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), window.__solmar);
} else {
  loadDemoPhotos();
}

export { LAYOUTS, PRESETS };
