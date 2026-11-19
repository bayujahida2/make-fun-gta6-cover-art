// Fixed scenes for screenshots: ?shot=editor shows the editor with demo
// photos loaded; ?shot=cover shows the cover alone. `title` and `subtitle`
// set the caption, `layout`, `preset` and `size` pick the look.
// window.__shotReady is set once painted.
export async function runShot(shot, query, app) {
  const title = query.get('title');
  const subtitle = query.get('subtitle');
  const layout = query.get('layout');
  const preset = query.get('preset');
  const size = query.get('size');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  app.loadDemoPhotos();
  if (title !== null) app.setTitle(title);
  if (subtitle !== null) app.setSubtitle(subtitle);
  if (layout) app.setLayout(layout);
  if (preset) app.setPreset(preset);
  if (size) app.setSize(size);
  app.renderPreview();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
