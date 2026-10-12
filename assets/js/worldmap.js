/* Dotted world map with connection arcs from Shah Alam to client cities.
   Renders into any element with [data-worldmap]. Falls back silently (the CSS
   gradient behind it remains) if the map data can't be loaded. */
(function () {
  const HUB = { name: 'Shah Alam', c: [101.53, 3.07] };
  const CITIES = [
    { name: 'London', c: [-0.13, 51.5] }, { name: 'Dubai', c: [55.27, 25.2] }, { name: 'Tokyo', c: [139.69, 35.69] },
    { name: 'Sydney', c: [151.21, -33.87] }, { name: 'New York', c: [-74.0, 40.71] }, { name: 'Singapore', c: [103.82, 1.35] },
    { name: 'Riyadh', c: [46.68, 24.71] }, { name: 'Shanghai', c: [121.47, 31.23] }, { name: 'Frankfurt', c: [8.68, 50.11] },
    { name: 'Jakarta', c: [106.85, -6.2] }, { name: 'Toronto', c: [-79.38, 43.65] }, { name: 'Mumbai', c: [72.88, 19.08] },
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DATA_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json';
  let landPromise = null;
  const getLand = () => landPromise || (landPromise = fetch(DATA_URL).then((r) => r.json()).then((topo) => topojson.feature(topo, topo.objects.land)));

  function mount(el) {
    if (!window.d3 || !window.topojson) return;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const opt = { align: el.dataset.align || 'right', scale: +(el.dataset.scale || 1) };
    let dots = [], arcs = [], hub, W = 0, H = 0, dpr = 1, raf = 0, land = null;

    function layout() {
      const r = el.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height); dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      const mobile = W < 700;
      const mapW = (mobile ? W * 1.9 : Math.max(W * 0.95, H * 1.9)) * opt.scale;
      const proj = d3.geoNaturalEarth1().fitWidth(mapW, { type: 'Sphere' });
      const [, hy] = proj(HUB.c);
      // keep the Asia–Pacific hub in view; anchor it to the right side on wide screens
      const [hx] = proj(HUB.c);
      const targetX = mobile ? W * 0.62 : opt.align === 'center' ? W * 0.5 : W * 0.68;
      const t = proj.translate();
      proj.translate([t[0] + (targetX - hx), t[1] + (H * 0.52 - hy)]);

      // rasterise land, then sample to dots
      const off = document.createElement('canvas'); off.width = Math.ceil(W); off.height = Math.ceil(H);
      const oc = off.getContext('2d');
      oc.fillStyle = '#000'; oc.beginPath(); d3.geoPath(proj, oc)(land); oc.fill();
      const img = oc.getImageData(0, 0, off.width, off.height).data;
      const step = mobile ? 6 : 7;
      dots = [];
      for (let y = step / 2; y < off.height; y += step) for (let x = step / 2; x < off.width; x += step) {
        if (img[(Math.floor(y) * off.width + Math.floor(x)) * 4 + 3] > 128) dots.push([x, y]);
      }
      hub = proj(HUB.c);
      arcs = CITIES.map((c, i) => {
        const p = proj(c.c);
        const mx = (hub[0] + p[0]) / 2, my = (hub[1] + p[1]) / 2;
        const dist = Math.hypot(p[0] - hub[0], p[1] - hub[1]);
        return { p, cp: [mx, my - dist * 0.35], name: c.name, offset: i / CITIES.length, inView: p[0] > -20 && p[0] < W + 20 && p[1] > -20 && p[1] < H + 20 };
      });
    }

    const qp = (a, cp, b, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cp[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cp[1] + t * t * b[1]];

    function draw(time) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(216, 189, 141, 0.42)';
      for (const [x, y] of dots) { ctx.beginPath(); ctx.arc(x, y, 1.15, 0, 6.283); ctx.fill(); }
      const T = reduced ? 0.6 : (time / 4200) % 1;
      for (const a of arcs) {
        ctx.strokeStyle = 'rgba(216, 189, 141, 0.38)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(hub[0], hub[1]); ctx.quadraticCurveTo(a.cp[0], a.cp[1], a.p[0], a.p[1]); ctx.stroke();
        // travelling pulse
        const t = (T + a.offset) % 1, q = qp(hub, a.cp, a.p, t);
        const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 7);
        g.addColorStop(0, 'rgba(255, 236, 200, 0.95)'); g.addColorStop(1, 'rgba(255, 236, 200, 0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], 7, 0, 6.283); ctx.fill();
        // city marker
        if (a.inView) {
          ctx.fillStyle = '#d8bd8d'; ctx.beginPath(); ctx.arc(a.p[0], a.p[1], 2.6, 0, 6.283); ctx.fill();
          if (W > 700 && Math.hypot(a.p[0] - hub[0], a.p[1] - hub[1]) > 45) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '500 11px Inter, system-ui, sans-serif'; ctx.fillText(a.name, a.p[0] + 7, a.p[1] + 4); }
        }
      }
      // hub
      const pulse = reduced ? 0.5 : (time / 1800) % 1;
      ctx.strokeStyle = `rgba(216, 189, 141, ${1 - pulse})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(hub[0], hub[1], 5 + pulse * 18, 0, 6.283); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hub[0], hub[1], 4, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#d8bd8d'; ctx.font = '600 12px Inter, system-ui, sans-serif'; ctx.fillText('Shah Alam', hub[0] + 10, hub[1] + 4);
      if (!reduced && visible) raf = requestAnimationFrame(draw);
    }

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible && land) raf = requestAnimationFrame(draw); }).observe(el);
    getLand().then((l) => {
      land = l; layout(); el.classList.add('map-ready'); raf = requestAnimationFrame(draw);
      let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { layout(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }, 150); }).observe(el);
    }).catch(() => {});
  }

  const start = () => document.querySelectorAll('[data-worldmap]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
