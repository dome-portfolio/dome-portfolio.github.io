/* Mount a single player on request and stop it when the dialog closes. */
const player = document.querySelector('.clip-player');
if (player && typeof player.showModal === 'function') {
  const title = player.querySelector('#clip-player-title');
  const stage = player.querySelector('.clip-player__stage');
  const source = player.querySelector('.clip-player__source');
  let trigger;
  document.addEventListener('click', event => {
    const card = event.target.closest('a[data-video]');
    if (!card || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    trigger = card;
    const fallbackTitle = document.documentElement.lang === 'en' ? 'Video' : 'วิดีโอ';
    title.textContent = card.dataset.videoTitle || card.querySelector('.video-card__label')?.textContent || fallbackTitle;
    source.href = card.href;
    const native = card.dataset.video === 'local';
    const media = document.createElement(native ? 'video' : 'iframe');
    media.src = card.dataset.videoSrc;
    if (native) {
      media.controls = true;
      media.autoplay = true;
      media.playsInline = true;
      if (card.dataset.videoPoster) media.poster = card.dataset.videoPoster;
      media.setAttribute('aria-label', title.textContent);
    } else {
      media.title = title.textContent + ' · ' + card.dataset.video;
      media.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      media.allowFullscreen = true;
    }
    stage.replaceChildren(media);
    player.showModal();
  });
  player.addEventListener('close', () => {
    stage.querySelector('video')?.pause();
    afterDialogExit(player, () => stage.replaceChildren());
    trigger?.focus({ preventScroll: true });
    trigger = null;
  });
}
