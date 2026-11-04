import * as THREE from 'three';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);
const small = () => innerWidth < 1000;
const brl = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');

/* ---------- rolagem suave ---------- */
let lenis;
if (window.Lenis) {
  lenis = new Lenis({ lerp: 0.08 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis ? (lenis.start(), lenis).scrollTo(id, { offset: -70 }) : document.querySelector(id).scrollIntoView({ behavior: 'smooth' }); }
}));

/* ---------- cabeçalho ---------- */
const hdr = document.querySelector('.hdr');
addEventListener('scroll', () => hdr.classList.toggle('sc', scrollY > 30), { passive: true });
const menu = document.getElementById('menu');
document.getElementById('menuBtn').addEventListener('click', () => menu.classList.toggle('open'));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
document.getElementById('ano').textContent = new Date().getFullYear();

/* ---------- loader + hero ---------- */
const intro = () => {
  document.getElementById('loader').classList.add('done');
  gsap.timeline()
    .from('.top__bg img', { scale: 1.25, duration: 2.4, ease: 'expo.out' }, 0)
    .to('.top__h .w', { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.1, stagger: .08, ease: 'expo.out' }, .1)
    .to('.fade', { opacity: 1, y: 0, duration: 1, stagger: .12, ease: 'expo.out' }, .5)
    .from('.mini', { opacity: 0, z: -300, rotateY: 40, duration: 1.4, stagger: .15, ease: 'expo.out' }, .7);
};
setTimeout(intro, 1150);
gsap.to('.top__bg img', { yPercent: 15, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.top', start: 'top top', end: 'bottom top', scrub: true } });
gsap.to('.top__in', { y: -100, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.top', start: '40% top', end: 'bottom top', scrub: true } });
const cards = document.querySelector('.top__cards');
addEventListener('pointermove', e => {
  const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  gsap.to(cards, { rotateY: x * 16, rotateX: -y * 12, duration: 1, ease: 'power3.out' });
  gsap.to('.mini--a', { x: x * 30, y: y * 20, duration: 1.2 });
  gsap.to('.mini--b', { x: x * -24, y: y * -18, duration: 1.2 });
  gsap.to('.mini--c', { x: x * 40, y: y * 30, duration: 1.2 });
});
gsap.to('.mini', { y: '+=12', duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: .5 });

// vendas ao vivo
let live = 1284937.40;
const liveEl = document.getElementById('liveSales');
setInterval(() => { live += 47 + Math.random() * 480; liveEl.textContent = 'R$ ' + live.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }, 1400);

/* ================= SKYLINE 3D DE DADOS ================= */
(function skyline() {
  const canvas = document.getElementById('skyline');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x050b1a, 1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050b1a, 18, 52);
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 200);

  const G = small() ? 18 : 26, S = 1.05, half = (G - 1) * S / 2, COUNT = G * G;
  const geo = new THREE.BoxGeometry(.82, 1, .82); geo.translate(0, .5, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .35, metalness: .3, emissive: 0x0a2a55, emissiveIntensity: .5 });
  const bars = new THREE.InstancedMesh(geo, mat, COUNT);
  bars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(bars);
  const cells = [];
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const x = i * S - half, z = j * S - half;
    const n = (Math.sin(i * .7) * Math.cos(j * .5) + Math.sin((i + j) * .31) + Math.random() * .8) / 2.8 + .5;
    cells.push({ x, z, i, j, n: Math.max(0, n), d: Math.hypot(x, z) });
  }
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  const cA = new THREE.Color(0x12305f), cB = new THREE.Color(0x3dd6ff), cC = new THREE.Color(0x7c5cff), cD = new THREE.Color(0xb6ff3d);

  // piso
  const grid = new THREE.GridHelper(G * S + 10, G + 10, 0x1d4a8a, 0x0e2448);
  grid.position.y = -.01; scene.add(grid);

  // partículas (cliques) caindo
  const PN = 700, pPos = new Float32Array(PN * 3), pSpd = new Float32Array(PN);
  for (let k = 0; k < PN; k++) { pPos.set([(Math.random() - .5) * G * S, Math.random() * 20, (Math.random() - .5) * G * S], k * 3); pSpd[k] = 2 + Math.random() * 4; }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0x3dd6ff, size: .09, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(new THREE.Points(pGeo, pMat));

  // "pixel" central + arcos de atribuição
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.7, 1), new THREE.MeshBasicMaterial({ color: 0x3dd6ff, wireframe: true, transparent: true }));
  core.position.y = 9; scene.add(core);
  const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(.38, 24, 24), new THREE.MeshBasicMaterial({ color: 0xb6ff3d, transparent: true }));
  core.add(coreGlow);
  const arcs = new THREE.Group(); scene.add(arcs);
  const arcMat = new THREE.LineBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
  for (let k = 0; k < 40; k++) {
    const c = cells[Math.floor(Math.random() * COUNT)];
    const a = new THREE.Vector3(c.x, 0, c.z), b = core.position.clone();
    const m = a.clone().lerp(b, .5); m.y += 3; m.x *= 1.3; m.z *= 1.3;
    arcs.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(a, m, b).getPoints(40)), arcMat));
  }

  scene.add(new THREE.HemisphereLight(0x8fd8ff, 0x050b1a, 1.1));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(10, 20, 8); scene.add(dl);
  const pl = new THREE.PointLight(0x3dd6ff, 60, 30); pl.position.set(0, 8, 0); scene.add(pl);

  // câmera: 3 pontos de vista
  const cams = [
    { p: new THREE.Vector3(0, 30, 26), t: new THREE.Vector3(0, 0, 0) },
    { p: new THREE.Vector3(16, 9, 14), t: new THREE.Vector3(0, 4, 0) },
    { p: new THREE.Vector3(-4, 6, 26), t: new THREE.Vector3(2, 3, 0) },
  ];
  const st = { p: 0 };
  const phases = document.querySelectorAll('.sky__phase'), evps = document.getElementById('evps'), meter = document.getElementById('meter');
  ScrollTrigger.create({
    trigger: '.sky', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: s => {
      gsap.to(st, { p: s.progress, duration: .9, ease: 'power2.out', overwrite: true });
      const idx = s.progress < .36 ? 0 : s.progress < .7 ? 1 : 2;
      phases.forEach((el, i) => el.classList.toggle('is-on', i === idx));
      meter.style.width = (15 + s.progress * 85) + '%';
    }
  });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w < h ? 60 : 42; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });
  let vis = false;
  new IntersectionObserver(([e]) => vis = e.isIntersecting).observe(canvas);
  const clock = new THREE.Clock(), cp = new THREE.Vector3(), ct = new THREE.Vector3();
  let evTimer = 0;
  (function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), .05);
    if (!vis) return;
    const t = clock.elapsedTime, p = st.p;
    const w1 = THREE.MathUtils.smoothstep(p, .2, .5), w2 = THREE.MathUtils.smoothstep(p, .58, .9);

    for (let k = 0; k < COUNT; k++) {
      const c = cells[k];
      const h0 = .15 + c.n * .5 + Math.max(0, Math.sin(t * 2 + c.d)) * .15;
      const h1 = .3 + c.n * 3.2 + Math.sin(c.d * .8 - t * 2.2) * .9 + .9;
      const h2 = .25 + Math.pow(c.i / (G - 1), 1.6) * 8.5 * (.75 + c.n * .35) + Math.sin(t * 1.5 + c.j * .4) * .12;
      const h = Math.max(.08, THREE.MathUtils.lerp(THREE.MathUtils.lerp(h0, h1, w1), h2, w2));
      dummy.position.set(c.x, 0, c.z); dummy.scale.set(1, h, 1); dummy.updateMatrix();
      bars.setMatrixAt(k, dummy.matrix);
      const r = Math.min(1, h / 7);
      if (w2 > .5) col.copy(cB).lerp(cD, r); else col.copy(cA).lerp(r > .45 ? cC : cB, Math.min(1, r * 2.2));
      bars.setColorAt(k, col);
    }
    bars.instanceMatrix.needsUpdate = true; bars.instanceColor.needsUpdate = true;

    const pa = pGeo.attributes.position.array;
    for (let k = 0; k < PN; k++) { pa[k * 3 + 1] -= pSpd[k] * dt; if (pa[k * 3 + 1] < 0) pa[k * 3 + 1] = 18 + Math.random() * 4; }
    pGeo.attributes.position.needsUpdate = true;
    pMat.opacity = .9 * (1 - w2 * .8);

    arcMat.opacity = Math.sin(w1 * Math.PI) * .55 + w1 * (1 - w2) * .2;
    core.material.opacity = .2 + w1 * .8 * (1 - w2 * .6);
    coreGlow.material.opacity = core.material.opacity;
    coreGlow.scale.setScalar(1 + Math.sin(t * 4) * .15);
    core.rotation.y = t * .6; core.rotation.x = t * .3;

    // câmera
    const seg = p < .5 ? 0 : 1, f = THREE.MathUtils.smootherstep(p < .5 ? p / .5 : (p - .5) / .5, 0, 1);
    cp.copy(cams[seg].p).lerp(cams[seg + 1].p, f); ct.copy(cams[seg].t).lerp(cams[seg + 1].t, f);
    const orbitA = Math.sin(t * .12) * .12;
    camera.position.set(cp.x * Math.cos(orbitA) - cp.z * Math.sin(orbitA) + mouse.x * 2, cp.y - mouse.y * 1.5, cp.x * Math.sin(orbitA) + cp.z * Math.cos(orbitA));
    camera.lookAt(ct);

    evTimer += dt;
    if (evTimer > .25) { evTimer = 0; evps.textContent = Math.round(1200 + p * 8400 + Math.random() * 300).toLocaleString('pt-BR'); }
    renderer.render(scene, camera);
  })();
})();

/* ================= DASHBOARD 3D ================= */
gsap.fromTo('#panel3d', { rotateX: 48, scale: .82, y: -40, opacity: .4 }, {
  rotateX: 0, scale: 1, y: 0, opacity: 1, ease: 'none',
  scrollTrigger: { trigger: '.dash__stage', start: 'top 95%', end: 'top 20%', scrub: 1 }
});
gsap.fromTo('.pop--1', { x: -80, opacity: 0 }, { x: 0, opacity: 1, scrollTrigger: { trigger: '.dash__stage', start: 'top 40%', end: 'top 10%', scrub: 1 } });
gsap.fromTo('.pop--2', { x: 80, opacity: 0 }, { x: 0, opacity: 1, scrollTrigger: { trigger: '.dash__stage', start: 'top 30%', end: 'top 0%', scrub: 1 } });
gsap.from('.dash__head > *', { y: 40, opacity: 0, stagger: .12, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.dash__head', start: 'top 85%' } });
ScrollTrigger.create({
  trigger: '.dash__stage', start: 'top 55%', once: true, onEnter: () => {
    document.querySelectorAll('.kpi b').forEach(b => {
      const n = +b.dataset.n, o = { v: 0 };
      gsap.to(o, { v: n, duration: 2.2, ease: 'power3.out', onUpdate: () => b.textContent = b.dataset.f ? o.v.toFixed(2).replace('.', ',') + b.dataset.f : brl(o.v) });
    });
    document.querySelectorAll('.ln').forEach(l => { const L = l.getTotalLength(); gsap.fromTo(l, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', onComplete: () => l.classList.contains('ln2') && (l.style.strokeDasharray = '5 5') }); });
    gsap.from('.area', { opacity: 0, duration: 2, delay: .8 });
    gsap.from('.tbl tbody tr', { x: -30, opacity: 0, stagger: .12, duration: .8, delay: .5, ease: 'expo.out' });
  }
});

/* ---------- recursos ---------- */
gsap.utils.toArray('.fcard').forEach(c => gsap.from(c, { y: 90, opacity: 0, rotateX: -18, transformPerspective: 900, transformOrigin: '50% 0', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 88%' } }));
gsap.utils.toArray('.fcard--img img').forEach(i => gsap.fromTo(i, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: i, start: 'top bottom', end: 'bottom top', scrub: true } }));

/* ---------- órbita ---------- */
const orbit = document.getElementById('orbit');
orbit.addEventListener('pointermove', e => {
  const r = orbit.getBoundingClientRect();
  gsap.to(orbit, { rotateY: ((e.clientX - r.left) / r.width - .5) * 20, rotateX: -((e.clientY - r.top) / r.height - .5) * 20, transformPerspective: 1000, duration: .8 });
});
orbit.addEventListener('pointerleave', () => gsap.to(orbit, { rotateX: 0, rotateY: 0, duration: 1 }));
gsap.from('.orbit', { scale: .4, opacity: 0, rotate: -40, ease: 'none', scrollTrigger: { trigger: '.orb', start: 'top 90%', end: 'top 25%', scrub: 1 } });
gsap.fromTo('.orb__bg img', { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.orb', start: 'top bottom', end: 'bottom top', scrub: true } });

/* ---------- planos ---------- */
gsap.from('.pl', { rotateY: 75, opacity: 0, transformOrigin: '0 50%', stagger: .15, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.plans__grid', start: 'top 85%' } });
gsap.from('.plans__head > *, .reg__copy > *', { y: 40, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.plans__head', start: 'top 85%' } });

/* ---------- formulário ---------- */
const mask = v => {
  v = v.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  return v;
};
const tel = document.getElementById('s-tel');
tel.addEventListener('input', () => tel.value = mask(tel.value));
const form = document.getElementById('signupForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  const f = form.elements, err = document.getElementById('signupError');
  form.querySelectorAll('input').forEach(i => i.classList.remove('x'));
  const fail = (i, m) => { i.classList.add('x'); i.focus(); err.textContent = m; gsap.fromTo(form, { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.3)' }); };
  if (f.nome.value.trim().length < 3) return fail(f.nome, 'Informe seu nome completo.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) return fail(f.email, 'Informe um e-mail válido.');
  if (f.telefone.value.replace(/\D/g, '').length < 10) return fail(f.telefone, 'Informe um telefone válido com DDD.');
  if (f.senha.value.length < 6) return fail(f.senha, 'A senha deve ter pelo menos 6 caracteres.');
  if (f.senha.value !== f.senha2.value) return fail(f.senha2, 'As senhas não coincidem.');
  err.textContent = '';
  const btn = form.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Enviando…';
  setTimeout(() => { form.reset(); form.querySelector('.frm__body').hidden = true; form.querySelector('.frm__ok').hidden = false; }, 1200);
});

/* ---------- popup login ---------- */
const mdl = document.getElementById('loginModal');
const open = () => { mdl.classList.add('on'); mdl.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); setTimeout(() => document.getElementById('l-user').focus(), 350); };
const close = () => { mdl.classList.remove('on'); mdl.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); };
document.querySelectorAll('[data-open-login]').forEach(b => b.addEventListener('click', open));
mdl.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
addEventListener('keydown', e => e.key === 'Escape' && close());
const login = document.getElementById('loginForm');
login.addEventListener('submit', e => {
  e.preventDefault();
  const u = document.getElementById('l-user'), p = document.getElementById('l-pass'), err = document.getElementById('loginError');
  if (!u.value.trim() || !p.value) { err.textContent = 'Preencha login e senha.'; return; }
  const btn = login.querySelector('button'); btn.disabled = true; btn.textContent = 'Verificando…'; err.textContent = '';
  setTimeout(() => {
    btn.disabled = false; btn.textContent = 'Entrar'; p.value = '';
    err.textContent = 'Login ou senha incorretos.';
    gsap.fromTo('.mdl__win', { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.3)' });
  }, 1300);
});

addEventListener('load', () => ScrollTrigger.refresh());
