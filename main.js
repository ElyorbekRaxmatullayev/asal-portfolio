(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal: staggered entrance per section, once */
  if ('IntersectionObserver' in window) {
    root.classList.add('js');
    document.querySelectorAll('section, .foot').forEach((sec) => {
      sec.querySelectorAll('[data-reveal]').forEach((el, i) => el.style.setProperty('--i', i));
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    // never leave content hidden
    setTimeout(() => document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('in')), 4000);
  }

  /* Viewer sets */
  const pieces = [...document.querySelectorAll('#hang .piece')];
  const sets = {
    art: pieces.map((p) => {
      const img = p.querySelector('img');
      const cap = p.querySelector('figcaption');
      return {
        src: img.dataset.full,
        alt: img.alt,
        title: cap.querySelector('.t').textContent,
        note: cap.textContent.replace(cap.querySelector('.t').textContent, '').trim(),
      };
    }),
    docs: [
      ['18-52-30', 'Laureate, “Kamalak yulduzlari” festival', 'Youth Forum of Uzbekistan, 2021'],
      ['18-52-26', 'Diploma, 3rd degree, painting', 'Samarkand Regional Department of Culture, 2021'],
      ['18-52-22', 'Diploma, 1st place, dutar performance', 'School No. 52, 25 March 2022'],
      ['18-52-44', 'Graduation certificate, fine art', 'Children’s Music and Art School No. 26, 29 May 2023'],
      ['18-51-59', 'Certificate of honour, 2nd place', '“Iqtidor” school ensemble competition, 4 April 2025'],
      ['18-52-19', 'Certificate of honour, excellent results', 'School No. 52, 24 May 2025'],
      ['18-52-33', 'Graduation certificate, dutar', 'Children’s Music and Art School No. 26, 31 May 2025'],
      ['18-52-06', 'Letter of gratitude, Youth Day', 'Samarkand District Administration'],
      ['18-52-15', 'Certificate of participation', 'School No. 52'],
    ].map(([f, title, note]) => ({ src: `assets/docs/${f}.jpg`, alt: `${title}. ${note}.`, title, note })),
  };

  const dlg = document.getElementById('viewer');
  const vImg = document.getElementById('viewer-img');
  const vTitle = document.getElementById('viewer-title');
  let cur = { set: 'art', i: 0, list: [] };

  function visibleList(set) {
    if (set !== 'art') return sets.docs.map((_, i) => i);
    return pieces.map((p, i) => (p.hidden ? -1 : i)).filter((i) => i >= 0);
  }
  function show(set, i) {
    const item = sets[set][i];
    cur.set = set; cur.i = i;
    vImg.src = item.src; vImg.alt = item.alt;
    vTitle.innerHTML = '';
    vTitle.append(item.title);
    const s = document.createElement('span'); s.textContent = item.note; vTitle.append(s);
  }
  function step(d) {
    const list = cur.list;
    let pos = list.indexOf(cur.i);
    if (pos < 0) pos = 0;
    show(cur.set, list[(pos + d + list.length) % list.length]);
  }
  let opener = null;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-set]');
    if (!b || typeof dlg.showModal !== 'function') return;
    opener = b;
    cur.list = visibleList(b.dataset.set);
    if (!cur.list.includes(+b.dataset.index)) cur.list = sets[b.dataset.set].map((_, i) => i);
    show(b.dataset.set, +b.dataset.index);
    dlg.showModal();
  });
  document.getElementById('v-prev').addEventListener('click', () => step(-1));
  document.getElementById('v-next').addEventListener('click', () => step(1));
  document.getElementById('v-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  dlg.addEventListener('close', () => { if (opener) opener.focus(); });

  /* Colour finder */
  const finder = document.getElementById('finder');
  const count = document.getElementById('count');
  const empty = document.getElementById('finder-empty');
  finder.hidden = false;
  finder.addEventListener('click', (e) => {
    const b = e.target.closest('.sw');
    if (!b) return;
    finder.querySelectorAll('.sw').forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
    const c = b.dataset.c;
    let n = 0;
    pieces.forEach((p) => {
      const on = c === 'all' || p.dataset.c.split(' ').includes(c);
      p.hidden = !on;
      p.classList.remove('enter');
      if (on) {
        p.style.setProperty('--i', n++);
        if (!reduced) { void p.offsetWidth; p.classList.add('enter'); }
      }
    });
    count.textContent = n;
    empty.hidden = n > 0;
  });

  /* Honours preview follows the row under the pointer or focus */
  const preview = document.getElementById('preview');
  const rows = [...document.querySelectorAll('#docs .doc')];
  function previewRow(row) {
    rows.forEach((r) => r.classList.toggle('is-on', r === row));
    const src = sets.docs[+row.dataset.index].src;
    if (preview.getAttribute('src') === src) return;
    preview.classList.add('swap');
    setTimeout(() => { preview.src = src; preview.classList.remove('swap'); }, reduced ? 0 : 180);
  }
  rows.forEach((r) => {
    r.addEventListener('mouseenter', () => previewRow(r));
    r.addEventListener('focus', () => previewRow(r));
  });
  if (rows[0]) rows[0].classList.add('is-on');
  sets.docs.forEach((d) => { const im = new Image(); im.src = d.src; });

  /* Hero painting drifts slower than the page */
  const heroImg = document.querySelector('.hero-art img');
  if (heroImg && !reduced) {
    let ticking = false;
    const wide = matchMedia('(min-width: 1081px)');
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(scrollY, innerHeight);
        heroImg.style.translate = wide.matches ? `0 ${y * 0.12}px` : '0 0';
        ticking = false;
      });
    }, { passive: true });
  }
})();
