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


  
  
  
  



  // Play / Pause
  const toggle = () => {
    if (!ready || !player) return;

    if (player.getPlayerState() === 1) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const stage = $('#stage');
  const shield = $('#shield');

  let hideControlsTimer = null;
  let tapTimer = null;
  let lastTapZone = '';
  let lastTapTime = 0;

  function showControls() {
    stage.classList.remove('controls-hidden');
    clearTimeout(hideControlsTimer);

    hideControlsTimer = setTimeout(() => {
      stage.classList.add('controls-hidden');
    }, 2500);
  }

  $('#pp').addEventListener('click', () => {
    toggle();
    showControls();
  });

  shield.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const r = stage.getBoundingClientRect();
    const x = e.clientX - r.left;

    const zone =
      x < r.width / 3 ? 'left' :
      x > r.width * 2 / 3 ? 'right' : 'center';

    const now = Date.now();

    if (
      zone !== 'center' &&
      zone === lastTapZone &&
      now - lastTapTime < 320
    ) {
      clearTimeout(tapTimer);
      lastTapZone = '';
      lastTapTime = 0;

      if (ready && player) {
        const current = player.getCurrentTime();
        const duration = player.getDuration();

        player.seekTo(
          Math.max(0, Math.min(
            duration,
            current + (zone === 'right' ? 10 : -10)
          )),
          true
        );
      }

      showControls();
      return;
    }

    clearTimeout(tapTimer);
    lastTapZone = zone;
    lastTapTime = now;

    tapTimer = setTimeout(() => {
      if (zone === 'center') toggle();

      showControls();
      lastTapZone = '';
      lastTapTime = 0;
    }, 330);
  });

  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.ctrl, .video-nav')) {
      showControls();
    }
  });

  showControls();

})();




  

  const st = $('#stage');

  $('#fs').addEventListener('click', async () => {
    try {
      const isFs =
        document.fullscreenElement ||
        document.webkitFullscreenElement;

      if (isFs) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      } else {
        if (st.requestFullscreen) {
          await st.requestFullscreen();
        } else if (st.webkitRequestFullscreen) {
          st.webkitRequestFullscreen();
        } else {
          // Fullscreen API না থাকলে ভিডিও চালু রেখেই
          // ফোনের Landscape Rotation ব্যবহার করা যাবে।
          if (screen.orientation?.lock) {
            await screen.orientation.lock('landscape');
          }
        }
      }
    } catch (err) {
      console.log('Fullscreen:', err);
    }

    showControls();
  });
