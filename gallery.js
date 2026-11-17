/* Pack each tile into the shortest column while keeping DOM and keyboard order. */
const masonryGrids = [...document.querySelectorAll('.masonry')];
const pendingLayouts = new Set();
let layoutFrame = 0;

function arrangeGrid(grid) {
  if (!grid.clientWidth) return;
  const columns = Number(getComputedStyle(grid).getPropertyValue('--masonry-columns')) || 2;
  const items = [...grid.children];
  const gap = Number.parseFloat(getComputedStyle(grid).getPropertyValue('--masonry-row-gap'));
  const bottoms = Array(columns).fill(1);
  grid.dataset.masonryReady = '';

  // Measure at an actual column width, then position all items together.
  for (const item of items) {
    item.style.gridArea = '1 / 1';
  }
  // Grid tracks use unscaled CSS pixels, including when the page is zoomed.
  const heights = items.map(item => item.offsetHeight);
  items.forEach((item, i) => {
    const column = bottoms.indexOf(Math.min(...bottoms));
    const row = bottoms[column];
    const height = heights[i];
    item.style.gridArea = row + ' / ' + (column + 1) + ' / span ' + Math.max(1, height);
    bottoms[column] = row + height + Math.ceil(gap);
  });
}

function queueLayout(grid) {
  pendingLayouts.add(grid);
  if (layoutFrame) return;
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0;
    pendingLayouts.forEach(arrangeGrid);
    pendingLayouts.clear();
  });
}

if (masonryGrids.length && 'ResizeObserver' in window) {
  const widths = new WeakMap();
  const observer = new ResizeObserver(entries => {
    for (const { target, contentRect: { width } } of entries) {
      if (width !== widths.get(target)) {
        widths.set(target, width);
        queueLayout(target);
      }
    }
  });
  for (const grid of masonryGrids) {
    observer.observe(grid);
    grid.addEventListener('load', () => queueLayout(grid), true);
    queueLayout(grid);
  }
  window.addEventListener('resize', () => masonryGrids.forEach(queueLayout));
  document.fonts.ready.then(() => masonryGrids.forEach(queueLayout));
}

/* Links remain usable as direct image links when the dialog isn't available. */
const viewer = document.querySelector('.image-viewer');
if (viewer && typeof viewer.showModal === 'function') {
  const photo = viewer.querySelector('.image-viewer__image');
  const title = viewer.querySelector('.image-viewer__title');
  const count = viewer.querySelector('.image-viewer__count');
  const original = viewer.querySelector('.image-viewer__original');
  const previous = viewer.querySelector('[data-image-previous]');
  const next = viewer.querySelector('[data-image-next]');
  const galleryMotion = matchMedia('(prefers-reduced-motion: no-preference)');
  let trigger = null;
  let images = [];
  let index = 0;
  let request = 0;
  let slideMotion;

  function showImage() {
    const link = images[index];
    const thumbnail = link.querySelector('img');
    const ticket = ++request;
    photo.src = thumbnail.currentSrc || thumbnail.src;
    photo.alt = thumbnail.alt;
    photo.classList.toggle('has-matte', link.hasAttribute('data-matte'));
    title.textContent = thumbnail.alt;
    count.textContent = (index + 1) + ' / ' + images.length;
    original.href = link.href;
    previous.hidden = next.hidden = images.length < 2;

    const full = new Image();
    full.src = link.href;
    full.decode().then(() => {
      if (ticket === request && viewer.open) photo.src = full.src;
    }).catch(() => { /* Keep the preview visible if the original can't be loaded. */ });
  }

  function move(offset) {
    if (images.length < 2) return;
    index = (index + offset + images.length) % images.length;
    showImage();
    slideMotion?.cancel();
    if (galleryMotion.matches) {
      slideMotion = photo.animate(
        [{ opacity: .55, translate: (offset * 6) + 'px 0' }, { opacity: 1, translate: '0 0' }],
        { duration: 180, easing: 'cubic-bezier(.2,.65,.25,1)' }
      );
    }
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-image]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const scope = link.closest('[data-gallery-scope]') || link.closest('[data-gallery]');
    if (!scope) return;
    event.preventDefault();
    trigger = link;
    images = [...scope.querySelectorAll('a[data-image]')];
    index = images.indexOf(link);
    showImage();
    viewer.showModal();
  });

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  viewer.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  viewer.addEventListener('click', event => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('close', () => {
    request++;
    slideMotion?.cancel();
    afterDialogExit(viewer, () => photo.removeAttribute('src'));
    trigger?.focus({ preventScroll: true });
    trigger = null;
  });
  galleryMotion.addEventListener('change', () => slideMotion?.cancel());
}
