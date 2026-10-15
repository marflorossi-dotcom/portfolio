/* ============================================================
   CONFIGURACIÓN
   Poné acá el "cloud name" de tu cuenta de Cloudinary
   (lo ves arriba a la izquierda en el panel de Cloudinary).
   Mientras diga TU_CLOUD_NAME se muestran los recuadros de ayuda.
   ============================================================ */
const CLOUD = 'ahmccelq';

const live = CLOUD !== 'TU_CLOUD_NAME';
const base = `https://res.cloudinary.com/${CLOUD}`;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const lb = document.getElementById('lb');
const lbImg = lb.querySelector('img');
const lbv = document.getElementById('lbv');

/* ---------- Imágenes (Cloudinary, formato y calidad automáticos) ---------- */
if (live) {
  document.querySelectorAll('[data-img]').forEach((el) => {
    const id = el.dataset.img;
    const img = new Image();
    img.srcset = [480, 900, 1400]
      .map((w) => `${base}/image/upload/f_auto,q_auto,w_${w}/${id} ${w}w`)
      .join(', ');
    img.sizes = '(max-width: 900px) 100vw, 50vw';
    img.src = `${base}/image/upload/f_auto,q_auto,w_900/${id}`;
    img.alt = el.dataset.alt || '';
    img.loading = 'lazy';
    img.onload = () => {
      el.classList.add('has-media');
      if (el.hasAttribute('data-zoom')) {
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', 'Ampliar: ' + img.alt);
      }
    };
    img.onerror = () => img.remove();
    el.append(img);
  });
}

/* ---------- Videos: vista previa muda + sonido + visor grande ---------- */
const ICON = {
  snd: `<svg data-off viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>
        <svg data-on viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>`,
  big: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-6 6M4 20l6-6"/></svg>`,
};
const previews = () => document.querySelectorAll('[data-video] video');
const visible = new Set();
let viewing = false;

const player = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      visible.add(e.target);
      if (!viewing) e.target.play().catch(() => {});
    } else {
      visible.delete(e.target);
      e.target.pause();
    }
  });
}, { threshold: 0.4 });

function setSound(v, on) {
  v.muted = !on;
  const b = v.parentElement.querySelector('.snd');
  if (!b) return;
  b.setAttribute('aria-pressed', String(on));
  b.setAttribute('aria-label', on ? 'Silenciar' : 'Activar sonido');
}

function openVideo(el) {
  viewing = true;
  previews().forEach((o) => { o.pause(); setSound(o, false); });
  lbImg.hidden = true;
  lbv.hidden = false;
  lbv.src = `${base}/video/upload/f_auto,q_auto:best,w_1280,h_1280,c_limit/${el.dataset.video}.mp4`;
  lbv.play().catch(() => {});
  lb.showModal();
}

if (live) {
  document.querySelectorAll('[data-video]').forEach((el) => {
    const v = document.createElement('video');
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'metadata';
    v.setAttribute('aria-label', el.dataset.alt || 'Video');
    v.src = `${base}/video/upload/f_auto,q_auto,w_720,h_720,c_limit/${el.dataset.video}.mp4`;
    v.onloadeddata = () => el.classList.add('has-media');
    v.onerror = () => v.remove();
    el.append(v);

    if (reduce) { v.controls = true; return; }

    el.insertAdjacentHTML('beforeend',
      `<button class="vbtn snd" type="button" aria-pressed="false" aria-label="Activar sonido">${ICON.snd}</button>
       <button class="vbtn big" type="button" aria-label="Ver en grande, con sonido">${ICON.big}</button>`);

    el.querySelector('.snd').addEventListener('click', (e) => {
      e.stopPropagation();
      const turnOn = v.muted;
      previews().forEach((o) => setSound(o, false)); // solo uno con sonido a la vez
      if (turnOn) setSound(v, true);
      if (v.paused) v.play().catch(() => {});
    });
    el.addEventListener('click', () => { if (v.isConnected) openVideo(el); });
    player.observe(v);
  });
}

/* ---------- YouTube: no carga nada hasta que se hace clic ---------- */
document.querySelectorAll('[data-yt]').forEach((btn) => {
  const id = btn.dataset.yt;
  if (id.startsWith('ID_')) return;
  btn.classList.add('has-media');
  btn.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`;
  btn.addEventListener('click', () => {
    btn.classList.remove('has-media');
    btn.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${btn.dataset.alt || 'Video'}" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  }, { once: true });
  // Por si el reproductor embebido falla, queda siempre el link directo
  btn.insertAdjacentHTML('afterend',
    `<a class="yt-link" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">Ver la sesión en YouTube</a>`);
});

/* ---------- Filtro de formatos en Redes ---------- */
const tabs = document.querySelectorAll('[data-filter]');
tabs.forEach((t) => t.addEventListener('click', () => {
  tabs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
  const f = t.dataset.filter;
  document.querySelectorAll('.feed .ph').forEach((c) => {
    c.classList.toggle('off', f !== 'todo' && c.dataset.format !== f);
  });
}));

/* ---------- Visor para ampliar imágenes ---------- */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-zoom]');
  if (!t || !t.querySelector('img')) return;
  lbImg.src = `${base}/image/upload/f_auto,q_auto,w_1600/${t.dataset.img}`;
  lbImg.alt = t.dataset.alt || '';
  lbImg.hidden = false;
  lbv.hidden = true;
  lb.showModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('[data-zoom]')) e.target.click();
});
lb.addEventListener('click', (e) => {
  if (e.target === lb || e.target.closest('.x')) lb.close();
});
lb.addEventListener('close', () => {
  lbv.pause();
  lbv.removeAttribute('src');
  lbv.load();
  lbv.hidden = true;
  lbImg.hidden = false;
  if (viewing) {
    viewing = false;
    visible.forEach((v) => v.play().catch(() => {}));
  }
});

/* ---------- Carrusel ---------- */
document.querySelectorAll('[data-carousel]').forEach((root) => {
  const track = root.querySelector('.track');
  const slides = [...track.children];
  const prev = root.querySelector('.prev');
  const next = root.querySelector('.next');
  const dots = root.querySelector('.dots');
  let cur = 0;
  const go = (i) => track.scrollTo({
    left: slides[Math.max(0, Math.min(i, slides.length - 1))].offsetLeft,
    behavior: reduce ? 'auto' : 'smooth',
  });
  dots.innerHTML = slides.map((_, i) => `<button type="button" aria-label="Ir a la imagen ${i + 1}"></button>`).join('');
  const dotBtns = [...dots.children];
  dotBtns.forEach((b, i) => b.addEventListener('click', () => go(i)));
  const sync = () => {
    const step = slides[0].offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
    cur = Math.round(track.scrollLeft / step);
    dotBtns.forEach((b, i) => b.setAttribute('aria-current', String(i === cur)));
    prev.disabled = cur === 0;
    next.disabled = cur === slides.length - 1;
  };
  let tick;
  track.addEventListener('scroll', () => { cancelAnimationFrame(tick); tick = requestAnimationFrame(sync); }, { passive: true });
  prev.addEventListener('click', () => go(cur - 1));
  next.addEventListener('click', () => go(cur + 1));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(cur - 1);
    if (e.key === 'ArrowRight') go(cur + 1);
  });
  addEventListener('resize', sync);
  sync();
});

/* ---------- Año del pie ---------- */
document.getElementById('year').textContent = new Date().getFullYear();
