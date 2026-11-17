(() => {
  const hoverMotion = matchMedia('(any-hover: hover) and (prefers-reduced-motion: no-preference)');
  let stopPreview = null;

  function stop() {
    stopPreview?.();
    stopPreview = null;
  }

  for (const preview of document.querySelectorAll('.catalog-row__preview[data-previews]')) {
    const card = preview.closest('a');
    const sources = preview.dataset.previews.split(' ');
    const slides = new Map();

    function loadSlide(src) {
      if (!slides.has(src)) {
        const image = new Image();
        image.alt = '';
        image.src = src;
        const ready = image.decode().then(() => {
          preview.append(image);
          return image;
        }).catch(error => {
          slides.delete(src);
          throw error;
        });
        slides.set(src, ready);
      }
      return slides.get(src);
    }

    card.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || !hoverMotion.matches || document.hidden) return;
      stop();
      let playing = true;
      let timer;
      let index = 0;
      let showing = null;

      stopPreview = () => {
        playing = false;
        clearTimeout(timer);
        showing?.classList.remove('is-current');
      };

      async function advance() {
        const src = sources[index];
        index = (index + 1) % (sources.length + 1);
        if (src) {
          try {
            const next = await loadSlide(src);
            if (!playing) return;
            showing?.classList.remove('is-current');
            next.classList.add('is-current');
            showing = next;
          } catch {
            // Skip an image that cannot be loaded and keep the current one.
          }
        } else {
          showing?.classList.remove('is-current');
          showing = null;
        }
        if (playing) timer = setTimeout(advance, 1450);
      }

      timer = setTimeout(advance, 650);
    });

    card.addEventListener('pointerleave', stop);
  }

  hoverMotion.addEventListener('change', stop);
  window.addEventListener('blur', stop);
  document.addEventListener('visibilitychange', stop);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') stop();
  });
})();
