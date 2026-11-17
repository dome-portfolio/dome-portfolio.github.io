/* The same navigation works at the top on desktop and at the bottom on mobile. */
const navigation = document.querySelector('#site-navigation');

/* Keep dialog contents in place until its closing transition is complete. */
function afterDialogExit(dialog, cleanup) {
  const transitions = dialog.getAnimations().map(animation => animation.finished);
  Promise.allSettled(transitions).then(() => {
    if (!dialog.open) cleanup();
  });
}

if (navigation) {
  const sectionLinks = navigation.querySelectorAll('a[href^="#"]');
  function updateCurrentLink() {
    for (const link of sectionLinks) {
      if (window.location.hash === link.hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  window.addEventListener('hashchange', updateCurrentLink);

  navigation.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

    const section = document.getElementById(link.hash.slice(1));
    if (!section) return;
    event.preventDefault();
    if (window.location.hash === link.hash) section.scrollIntoView();
    else window.location.hash = link.hash;
    updateCurrentLink();
    const heading = section.querySelector('h2') || section;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  });

  updateCurrentLink();
}

/* Small entrance feedback. Content remains visible before and without animation. */
const quietMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!quietMotion.matches && 'IntersectionObserver' in window) {
  const active = new Set();
  const reveal = new IntersectionObserver(entries => {
    if (quietMotion.matches) return;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal.unobserve(entry.target);
      const motion = entry.target.animate(
        [{opacity:.88,translate:'0 6px'},{opacity:1,translate:'0 0'}],
        {duration:220,easing:'cubic-bezier(.2,.65,.25,1)'}
      );
      active.add(motion);
      motion.onfinish = motion.oncancel = () => active.delete(motion);
    }
  }, {threshold:.12});
  document.querySelectorAll('.card-spotlight, .bento-card, .timeline, .contact-box').forEach(item => reveal.observe(item));
  quietMotion.addEventListener('change', event => {
    if (!event.matches) return;
    reveal.disconnect();
    active.forEach(motion => motion.cancel());
  });
}

