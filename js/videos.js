(function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (t) => { t = Math.max(0, Math.floor(t || 0)); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); };
  const date = (d) => d ? new Date(d).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const PLAY = '<svg class="fill" viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>';
  const PAUSE = '<svg class="fill" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
  const SPEEDS = [1, 1.25, 1.5, 2, 0.75];

  let chans = {}, all = [], filter = 'all', q = '', shown = 20, cur = null;
  let player = null, ready = false, apiReady = false, pending = null, timer = null, dragging = false, si = 0;
  const seek = $('#seek');
  $('#pp').innerHTML = PLAY;

  /* ---------- তালিকা ---------- */
  function note(msg) { $('#vlist').innerHTML = '<p class="note">' + msg + '</p>'; $('#count').textContent = ''; $('#more').hidden = true; }

  function render() {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = all.filter((v) => (filter === 'all' || v.c === filter) &&
      terms.every((t) => (v.t + ' ' + ((chans[v.c] || {}).name || '')).toLowerCase().includes(t)));
    $('#count').textContent = list.length + ' টি ভিডিও';
    if (!list.length) { $('#vlist').innerHTML = '<p class="note">কিছু পাওয়া যায়নি। অন্য শব্দে খুঁজুন।</p>'; $('#more').hidden = true; return; }
    $('#vlist').innerHTML = list.slice(0, shown).map((v) =>
      '<button class="vcard' + (v.id === cur ? ' now' : '') + '" data-id="' + v.id + '">' +
      '<img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg">' +
      '<span><span class="vt">' + esc(v.t) + '</span><span class="vm">' + esc((chans[v.c] || {}).name || '') + ' • ' + date(v.d) + '</span></span></button>').join('');
    $('#more').hidden = list.length <= shown;
  }

  fetch('../data/videos.json?t=' + Date.now())
    .then((r) => { if (!r.ok) throw 0; return r.json(); })
    .then((d) => {
      (d.channels || []).forEach((c) => (chans[c.id] = c));
      all = d.videos || [];
      if (!all.length) return note('ভিডিওর তালিকা এখনো তৈরি হয়নি। GitHub-এর Actions থেকে "Update videos" চালান।');
      $('#chips').innerHTML = [{ id: 'all', name: 'সব' }].concat(d.channels).map((c) =>
        '<button class="fchip' + (c.id === 'all' ? ' on' : '') + '" data-ch="' + c.id + '">' + esc(c.name) + '</button>').join('');
      render();
    })
    .catch(() => note('ভিডিওর তালিকা লোড করা যায়নি।'));

  $('#q').addEventListener('input', (e) => { q = e.target.value; shown = 20; render(); });
  $('#more').addEventListener('click', () => { shown += 20; render(); });
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ch]'); if (!b) return;
    filter = b.dataset.ch; shown = 20;
    document.querySelectorAll('.fchip').forEach((x) => x.classList.toggle('on', x === b));
    render();
  });
  $('#vlist').addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b) play(b.dataset.id); });

    function changeVideo(direction) {
    if (!cur || !all.length) return;

    const index = all.findIndex((v) => v.id === cur);
    if (index === -1) return;

    const nextIndex = (index + direction + all.length) % all.length;
    play(all[nextIndex].id);
  }

  $('#prevVideo').addEventListener('click', () => changeVideo(-1));
  $('#nextVideo').addEventListener('click', () => changeVideo(1));

  /* ---------- প্লেয়ার ---------- */
  window.onYouTubeIframeAPIReady = () => { apiReady = true; if (pending) mk(); };
  const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);

  function mk() {
    if (player) return;
    player = new YT.Player('yt', {
      playerVars: { controls: 0, modestbranding: 1, rel: 0, playsinline: 1, disablekb: 1, iv_load_policy: 3, fs: 0 },
      events: { onReady: () => { ready = true; if (pending) player.loadVideoById(pending); }, onStateChange: onState }
    });
  }

  function play(id) {
    cur = id; pending = id;
    const v = all.find((x) => x.id === id);
    $('#vtitle').textContent = v.t; $('#vch').textContent = (chans[v.c] || {}).name || '';
    $('#idle').classList.add('hide');
    document.querySelectorAll('.vcard').forEach((c) => c.classList.toggle('now', c.dataset.id === id));
    if (ready) player.loadVideoById(id); else if (apiReady) mk();
    $('#pwrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function onState(e) {
    $('#pp').innerHTML = e.data === 1 ? PAUSE : PLAY;
    clearInterval(timer);
    if (e.data === 1 || e.data === 3) timer = setInterval(tick, 400);
    tick();
  }

  function tick() {
    if (!ready) return;
    const d = player.getDuration() || 0, t = player.getCurrentTime() || 0;
    $('#tm').textContent = fmt(t) + ' / ' + fmt(d);
    if (!dragging) { const p = d ? t / d * 1000 : 0; seek.value = p; seek.style.setProperty('--p', p / 10 + '%'); }
  }

  const toggle = () => { if (!ready) return; player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo(); };
  $('#pp').addEventListener('click', toggle);
  $('#shield').addEventListener('click', toggle);
  $('#back').addEventListener('click', () => ready && player.seekTo(player.getCurrentTime() - 10, true));
  $('#fwd').addEventListener('click', () => ready && player.seekTo(player.getCurrentTime() + 10, true));
  seek.addEventListener('input', () => { dragging = true; seek.style.setProperty('--p', seek.value / 10 + '%'); });
  seek.addEventListener('change', () => { if (ready) player.seekTo(seek.value / 1000 * player.getDuration(), true); dragging = false; });
  $('#speed').addEventListener('click', () => { if (!ready) return; si = (si + 1) % SPEEDS.length; player.setPlaybackRate(SPEEDS[si]); $('#speed').textContent = SPEEDS[si] + 'x'; });

  const st = $('#stage'), reqFs = st.requestFullscreen || st.webkitRequestFullscreen;
  if (!reqFs) $('#fs').hidden = true;
  $('#fs').addEventListener('click', () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else reqFs.call(st);
  });
})();
                                                                              
