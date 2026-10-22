(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const toastEl = $('#toast');
  let toastTimer;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function open(url) {
    if (SITE.openInNewTab) window.open(url, '_blank', 'noopener');
    else location.href = url;
  }

  function go(key) {
    if (key === 'home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const p = SITE.pages[key];
    if (!p) return;
    if (!p.ready) { toast(p.title + ' পেজ শীঘ্রই আসছে'); return; }
    open(p.url);
  }

  // data-go (ভেতরের পেজ) ও data-link (বাইরের লিংক)
  document.addEventListener('click', (e) => {
    const goBtn = e.target.closest('[data-go]');
    if (goBtn) { go(goBtn.dataset.go); closeDrawer(); return; }
    const linkBtn = e.target.closest('[data-link]');
    if (linkBtn) open(SITE.links[linkBtn.dataset.link]);
  });

  // সাইড মেনু
  const drawer = $('#drawer'), scrim = $('#scrim'), list = $('#drawerList');
  Object.entries(SITE.pages).forEach(([key, p]) => {
    const li = document.createElement('li');
    li.innerHTML = '<button data-go="' + key + '">' + p.title + '</button>';
    list.appendChild(li);
  });
  function openDrawer()  { drawer.classList.add('open'); scrim.classList.add('show'); drawer.setAttribute('aria-hidden', 'false'); }
  function closeDrawer() { drawer.classList.remove('open'); scrim.classList.remove('show'); drawer.setAttribute('aria-hidden', 'true'); }
  $('#menuBtn').addEventListener('click', openDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  // সার্চ (পরে আলাদা পেজ/ফাংশন যুক্ত হবে)
  $('#searchBtn').addEventListener('click', () => toast('সার্চ শীঘ্রই আসছে'));
})();
