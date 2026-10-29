/* ============================================================================
   desk.js . THE PHYSICAL TERMINAL
   ----------------------------------------------------------------------------
   VOA terminal 07 is a real machine, and HQ being under attack has damaged it.
   Anything shown on it gets the same damage, so this file is loaded by the
   terminal page itself and by any page the terminal's desktop opens. The
   damage is seeded, so the cracks sit in exactly the same place on every page:
   it is the glass that is broken, not the page.

     damage    cracked glass from one impact point, panel ink bleeding out
               under the crack, dead pixel columns, a dead row, a backlight
               zone that keeps failing, and sparks out of the crack now and
               then with an electrical crackle. Always on.

     ambient   the attack itself: emergency red lights, the air raid siren,
               rolling bar, brownouts, torn bands, distant impacts, text
               corrupting and jumping, and the evacuation banner. Only for
               pages that do not run their own attack layer. Turn it on with
               data-ambient="1" on the script tag, and name what should shake
               with data-shake="<selector>".

   The terminal page has its own richer attack layer, so it loads this with
   damage only and calls Desk.spark() from its own impacts.

   Sound follows the terminal's own switch (localStorage voa_sound), and a
   browser will not start audio before a gesture, so it arms on the first one.
   ========================================================================== */
(function(){
  "use strict";

  const me      = document.currentScript;
  const AMBIENT = !!(me && me.dataset.ambient);
  const SHAKE   = (me && me.dataset.shake) || "";
  const calm    = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rnd     = (a, b) => a + Math.random() * (b - a);
  const pick    = arr => arr[Math.floor(Math.random() * arr.length)];
  const JUNK    = "!<>#@%&/\\|=+-_~^:;[]{}*0123456789ABCDEF█";
  const junk    = n => { let s = ""; for (let i = 0; i < n; i++) s += JUNK[Math.floor(Math.random() * JUNK.length)]; return s; };

  // where the screen was hit, as a fraction of the viewport
  const IX = 0.76, IY = 0.27;

  /* ---- styles ------------------------------------------------------------ */
  const css = `
.dk{position:fixed;pointer-events:none;user-select:none}
.dk-glass{inset:0;z-index:69;overflow:hidden}
.dk-glass svg{position:absolute;left:calc(${IX * 100}vw - 1100px);top:calc(${IY * 100}vh - 1100px);
  width:2200px;height:2200px;overflow:visible}
.dk-bleed{z-index:64;left:calc(${IX * 100}vw - 170px);top:calc(${IY * 100}vh - 170px);width:340px;height:340px;
  background:
    radial-gradient(closest-side at 46% 52%,#000 0 30%,rgba(0,0,0,.88) 44%,rgba(36,0,58,.6) 60%,rgba(0,70,90,.25) 76%,transparent),
    radial-gradient(closest-side at 70% 30%,rgba(0,0,0,.9) 0 25%,rgba(40,0,60,.4) 55%,transparent);
  filter:blur(1.5px);animation:dkBleed 7s ease-in-out infinite alternate}
@keyframes dkBleed{from{scale:1}to{scale:1.06}}
.dk-col{top:0;bottom:0;z-index:68}
.dk-col.a{left:31.4vw;width:2px;background:rgba(0,255,96,.7)}
.dk-col.b{left:63.1vw;width:1px;background:rgba(255,255,255,.55)}
.dk-col.c{left:88.6vw;width:1px;background:rgba(255,0,200,.55);animation:dkStut 3.1s steps(1) infinite}
.dk-row{left:0;right:0;z-index:68}
.dk-row.a{top:71.5vh;height:1px;background:rgba(160,255,255,.45)}
.dk-row.b{top:calc(71.5vh + 1px);height:5px;background:#000}
@keyframes dkStut{0%{opacity:1}42%{opacity:0}44%{opacity:1}80%{opacity:.2}83%{opacity:1}}
/* the backlight behind the cracked corner keeps cutting out */
.dk-dim{left:58vw;top:0;right:0;height:56vh;z-index:63;background:#000;opacity:0;
  animation:dkDim 6.3s steps(1) infinite}
@keyframes dkDim{0%{opacity:0}22%{opacity:.5}23%{opacity:0}24%{opacity:.35}25.5%{opacity:0}
  67%{opacity:.6}69%{opacity:.15}70%{opacity:0}}
.dk-spark{position:absolute;left:${IX * 100}vw;top:${IY * 100}vh;width:3px;height:3px;border-radius:50%;
  background:#fff6c8;box-shadow:0 0 6px 2px rgba(255,170,40,.9);
  animation:dkSpark var(--t,.8s) cubic-bezier(.2,.6,.4,1) forwards}
@keyframes dkSpark{
  0%  {translate:0 0;opacity:1}
  35% {translate:calc(var(--dx) * .55) var(--up);opacity:1}
  100%{translate:var(--dx) var(--dy);opacity:0}
}
.dk-flare{z-index:69;left:calc(${IX * 100}vw - 90px);top:calc(${IY * 100}vh - 90px);width:180px;height:180px;
  border-radius:50%;background:radial-gradient(circle,rgba(255,240,200,.9),rgba(255,150,40,.35) 30%,transparent 65%);
  animation:dkFlare .25s ease-out forwards}
@keyframes dkFlare{from{opacity:1}to{opacity:0}}

/* ambient attack, for pages without their own */
.dk-red{inset:0;z-index:65;overflow:hidden;mix-blend-mode:screen;
  background:
    radial-gradient(55% 45% at 0% 0%,rgba(255,24,24,.6),transparent 70%),
    radial-gradient(55% 45% at 100% 0%,rgba(255,24,24,.6),transparent 70%),
    radial-gradient(ellipse at 50% 50%,transparent 42%,rgba(210,0,0,.5));
  animation:dkRed 2s ease-in-out infinite}
@keyframes dkRed{0%,100%{opacity:.06}50%{opacity:.95}}
.dk-red::before{content:"";position:absolute;left:50%;top:50%;width:250vmax;height:250vmax;translate:-50% -50%;
  background:conic-gradient(from 0deg,rgba(255,30,30,.2) 0 16deg,transparent 30deg 180deg,
                            rgba(255,30,30,.2) 180deg 196deg,transparent 210deg 360deg);
  animation:dkBeacon 2s linear infinite}
@keyframes dkBeacon{to{rotate:360deg}}
.dk-roll{left:0;right:0;top:0;height:22vh;z-index:66;
  background:linear-gradient(180deg,transparent,rgba(255,255,255,.04) 40%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.02) 56%,transparent);
  animation:dkRoll 5.8s linear infinite}
@keyframes dkRoll{from{translate:0 -24vh}to{translate:0 112vh}}
.dk-flick{inset:0;z-index:66;background:#000;opacity:0;animation:dkFlick 4.7s steps(1) infinite}
@keyframes dkFlick{0%{opacity:0}37%{opacity:.28}38%{opacity:0}39%{opacity:.14}40%{opacity:0}
  71%{opacity:.4}72%{opacity:0}91%{opacity:.18}92.5%{opacity:.34}93%{opacity:0}}
.dk-tears{inset:0;z-index:67;overflow:hidden}
.dk-tear{position:absolute;left:-40px;right:-40px;backdrop-filter:brightness(2) contrast(2.4) blur(.6px);
  background:repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0 3px,transparent 3px 7px)}
.dk-tear.inv{backdrop-filter:invert(1);background:none}
.dk-banner{left:0;right:0;bottom:0;z-index:70;padding:7px 12px;text-align:center;
  font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,"Courier New",monospace;
  letter-spacing:.14em;text-transform:uppercase;color:#fff;background:rgba(150,0,0,.88);
  border-top:1px solid #ff4a4a}
.dk-banner b{font-weight:400;animation:dkBlink 1.05s step-end infinite}
@keyframes dkBlink{0%,50%{opacity:1}50.01%,100%{opacity:0}}
.dk-hurt{text-shadow:-3px 0 rgba(255,40,80,.85),3px 0 rgba(40,220,255,.85) !important}
html.dk-gl .dk-shake{translate:var(--dkx,8px) 0;filter:contrast(1.5) brightness(1.25)}
html.dk-quake .dk-shake{animation:dkQuake .55s cubic-bezier(.2,.7,.3,1)}
@keyframes dkQuake{
  0%{translate:0 0;filter:none} 8%{translate:-10px 6px;filter:brightness(1.8) contrast(1.4)}
  18%{translate:9px -7px;filter:brightness(1.3)} 32%{translate:-6px 4px;filter:none}
  48%{translate:5px -3px} 66%{translate:-2px 1px} 100%{translate:0 0}
}
@media(prefers-reduced-motion:reduce){
  .dk,.dk *,.dk::before{animation:none !important}
  .dk-roll,.dk-flick,.dk-dim{display:none}
  .dk-red{opacity:.35}
}`;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  function el(cls, parent){
    const d = document.createElement("div");
    d.className = "dk " + cls;
    d.setAttribute("aria-hidden", "true");
    (parent || document.body).appendChild(d);
    return d;
  }

  /* ---- the crack ----------------------------------------------------------
     Seeded random, so every page draws the identical break. Long jagged
     fractures run out from the impact, some forking, with short concentric
     segments around the centre where the glass took the hit. */
  function seeded(s){
    return function(){
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function crackSVG(){
    const R = seeded(7207);
    const f = n => n.toFixed(1);
    let d = "", shards = "";
    const mains = 12, ends = [];

    function run(x, y, a, len, depth){
      let p = "M" + f(x) + " " + f(y), gone = 0;
      while (gone < len){
        a += (R() - .5) * .55;
        const s = 14 + R() * 26;
        x += Math.cos(a) * s; y += Math.sin(a) * s; gone += s;
        p += "L" + f(x) + " " + f(y);
        if (depth < 2 && R() < .1) run(x, y, a + (R() < .5 ? -1 : 1) * (.45 + R() * .5), len * (.2 + R() * .3), depth + 1);
      }
      d += p;
      return [x, y];
    }

    const angles = [];
    for (let i = 0; i < mains; i++){
      const a = (i / mains) * Math.PI * 2 + (R() - .5) * .4;
      angles.push(a);
      ends.push(run(0, 0, a, 220 + R() * 900, 0));
    }
    // rings around the impact
    [20, 44, 78, 120].forEach((r, k) => {
      for (let i = 0; i < mains; i++){
        if (R() > .72 - k * .1) continue;
        const a1 = angles[i], a2 = angles[(i + 1) % mains] + (i === mains - 1 ? Math.PI * 2 : 0);
        const rr = r * (.85 + R() * .3);
        d += "M" + f(Math.cos(a1) * rr) + " " + f(Math.sin(a1) * rr) +
             "L" + f(Math.cos((a1 + a2) / 2) * rr * (.9 + R() * .2)) + " " + f(Math.sin((a1 + a2) / 2) * rr * (.9 + R() * .2)) +
             "L" + f(Math.cos(a2) * rr) + " " + f(Math.sin(a2) * rr);
      }
    });
    // loose shards right at the centre, catching the light
    for (let i = 0; i < 9; i++){
      const a = R() * Math.PI * 2, r = 6 + R() * 34, w = .3 + R() * .5;
      shards += '<path d="M0 0L' + f(Math.cos(a) * r) + " " + f(Math.sin(a) * r) + "L" +
                f(Math.cos(a + w) * r * .8) + " " + f(Math.sin(a + w) * r * .8) +
                'z" fill="rgba(255,255,255,' + (.05 + R() * .12).toFixed(2) + ')"/>';
    }
    return '<svg viewBox="-1100 -1100 2200 2200" xmlns="http://www.w3.org/2000/svg">' + shards +
      '<path d="' + d + '" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="rgba(255,255,255,.62)" stroke-width=".9" stroke-linejoin="round"/>' +
      '<circle r="5" fill="rgba(255,255,255,.5)"/></svg>';
  }

  el("dk-dim");
  el("dk-bleed");
  ["a", "b", "c"].forEach(c => el("dk-col " + c));
  el("dk-row a"); el("dk-row b");
  const glass = el("dk-glass");
  glass.innerHTML = crackSVG();

  /* ---- sound ------------------------------------------------------------- */
  let ctx = null, master = null, nbuf = null, siren = null;
  const soundOn = () => { try { return localStorage.getItem("voa_sound") !== "0"; } catch(e){ return true; } };

  function ensure(){
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = soundOn() ? 1 : 0;
    master.connect(ctx.destination);
  }
  function noise(){
    if (nbuf) return nbuf;
    const n = Math.floor(ctx.sampleRate * 0.4);
    nbuf = ctx.createBuffer(1, n, ctx.sampleRate);
    const ch = nbuf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    return nbuf;
  }
  const live = () => ctx && ctx.state === "running" && soundOn();

  // the panel shorting out: a handful of tiny bright clicks in quick succession
  function crackle(){
    if (!live()) return;
    const t = ctx.currentTime, n = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++){
      const s = t + Math.random() * .32;
      const src = ctx.createBufferSource(); src.buffer = noise();
      src.playbackRate.value = 1.5 + Math.random();
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2400 + Math.random() * 2400;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(.05 + Math.random() * .06, s + .002);
      g.gain.exponentialRampToValueAtTime(.0001, s + .02 + Math.random() * .03);
      src.connect(hp); hp.connect(g); g.connect(master);
      src.start(s); src.stop(s + .06);
    }
  }

  // same wail as the terminal page: 2s cycle, through the walls
  function startSiren(){
    if (!AMBIENT || siren || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 640;
    const lfo = ctx.createOscillator(); lfo.type = "triangle"; lfo.frequency.value = .5;
    const depth = ctx.createGain(); depth.gain.value = 230;
    lfo.connect(depth); depth.connect(o.frequency);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = .7;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1700;
    const g = ctx.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(.024, t, 1.2);
    o.connect(bp); bp.connect(lp); lp.connect(g); g.connect(master);
    o.start(); lfo.start();
    siren = g;
  }

  function boom(){
    if (!live()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(74, t); o.frequency.exponentialRampToValueAtTime(24, t + .9);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(.2, t + .02); og.gain.exponentialRampToValueAtTime(.0001, t + 1.1);
    o.connect(og); og.connect(master); o.start(t); o.stop(t + 1.15);
    const s = ctx.createBufferSource(); s.buffer = noise(); s.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(80, t + .9);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0, t); sg.gain.linearRampToValueAtTime(.16, t + .03); sg.gain.exponentialRampToValueAtTime(.0001, t + 1);
    s.connect(lp); lp.connect(sg); sg.connect(master); s.start(t); s.stop(t + 1.05);
  }

  const ARM = ["pointerdown", "mousedown", "keydown", "touchstart", "wheel", "click"];
  function arm(){
    ensure();
    if (!ctx) return;
    const done = () => {
      if (ctx.state !== "running") return;
      ARM.forEach(e => window.removeEventListener(e, arm, true));
      startSiren();
    };
    ctx.state === "suspended" ? ctx.resume().then(done).catch(() => {}) : done();
  }
  ARM.forEach(e => window.addEventListener(e, arm, true));
  arm();

  // the terminal's sound switch lives on another page or in another script,
  // so check it now and then rather than wiring into it
  setInterval(() => {
    if (master) master.gain.setTargetAtTime(soundOn() ? 1 : 0, ctx.currentTime, .05);
  }, 700);
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    document.hidden ? ctx.suspend() : ctx.resume();
  });

  /* ---- sparks -------------------------------------------------------------- */
  function spark(){
    if (document.hidden) return;
    crackle();
    if (calm) return;
    const f = el("dk-flare", glass);
    setTimeout(() => f.remove(), 260);
    const n = 9 + Math.floor(Math.random() * 9);
    for (let i = 0; i < n; i++){
      const p = document.createElement("i");
      p.className = "dk-spark";
      const dx = rnd(-160, 160);
      p.style.setProperty("--dx", dx.toFixed(0) + "px");
      p.style.setProperty("--up", rnd(-90, -10).toFixed(0) + "px");
      p.style.setProperty("--dy", rnd(60, 260).toFixed(0) + "px");
      p.style.setProperty("--t", rnd(.45, .95).toFixed(2) + "s");
      glass.appendChild(p);
      setTimeout(() => p.remove(), 1000);
    }
  }
  (function sparkLoop(){
    spark();
    setTimeout(sparkLoop, rnd(7000, 17000));
  })();

  window.Desk = { spark };

  if (!AMBIENT) return;

  /* ---- ambient attack ------------------------------------------------------ */
  el("dk-red"); el("dk-roll"); el("dk-flick");
  const tears = el("dk-tears");
  const banner = el("dk-banner");
  banner.innerHTML = "VOA OS . TERMINAL 07 . <b>EVACUATION ORDER IN EFFECT</b> . ABANDON THIS TERMINAL";
  document.body.style.paddingBottom = "calc(" + (getComputedStyle(document.body).paddingBottom || "0px") + " + 34px)";

  const shakers = SHAKE ? Array.from(document.querySelectorAll(SHAKE)) : [];
  shakers.forEach(n => n.classList.add("dk-shake"));
  const root = document.documentElement;

  function tear(){
    const n = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++){
      const t = document.createElement("div");
      t.className = "dk-tear" + (Math.random() < .45 ? " inv" : "");
      t.style.top = rnd(0, 100).toFixed(1) + "vh";
      t.style.height = Math.round(rnd(2, 42)) + "px";
      tears.appendChild(t);
      setTimeout(() => t.remove(), rnd(50, 240));
    }
  }

  // plain text leaves only, so restoring them cannot wipe out any markup
  const leaves = () => Array.from(document.querySelectorAll("p,td,dt,dd,li,h3,caption,.role,.small"))
    .filter(n => !n.children.length && n.textContent.trim().length > 3 && !n.dataset.dk && !n.closest(".dk"));
  const onScreen = n => { const r = n.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };

  function corrupt(){
    const n = pick(leaves().filter(onScreen));
    if (!n) return;
    const orig = n.textContent, ch = orig.split("");
    const hits = 1 + Math.floor(rnd(1, Math.min(orig.length / 5, 14)));
    for (let i = 0; i < hits; i++){
      const j = Math.floor(Math.random() * ch.length);
      if (ch[j] !== " ") ch[j] = junk(1);
    }
    n.dataset.dk = "1";
    n.textContent = ch.join("");
    setTimeout(() => { n.textContent = orig; delete n.dataset.dk; }, rnd(90, 280));
  }

  function shove(){
    const all = leaves().filter(onScreen);
    const k = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < k && all.length; i++){
      const n = all.splice(Math.floor(Math.random() * all.length), 1)[0];
      n.dataset.dk = "1";
      n.style.translate = Math.round(rnd(-36, 36)) + "px 0";
      n.classList.add("dk-hurt");
      setTimeout(() => { n.style.translate = ""; n.classList.remove("dk-hurt"); delete n.dataset.dk; }, rnd(70, 230));
    }
  }

  function burst(big){
    if (document.hidden) return;
    if (Math.random() < .6) corrupt();
    if (calm) return;
    tear();
    if (Math.random() < .6) shove();
    if (big){
      root.style.setProperty("--dkx", Math.round(rnd(-14, 14)) + "px");
      root.classList.add("dk-gl");
      setTimeout(() => root.classList.remove("dk-gl"), rnd(80, 240));
    }
  }
  (function burstLoop(){
    burst(Math.random() < .28);
    const next = Math.random() < .32 ? rnd(40, 150) : rnd(600, 3000);
    setTimeout(burstLoop, calm ? next * 3 : next);
  })();

  function impact(){
    if (document.hidden) return;
    boom();
    spark();
    if (calm) return;
    root.classList.remove("dk-quake");
    void root.offsetWidth;
    root.classList.add("dk-quake");
    setTimeout(() => root.classList.remove("dk-quake"), 600);
    setTimeout(() => burst(true), 40);
    setTimeout(() => burst(true), 180);
  }
  setTimeout(function impactLoop(){
    impact();
    setTimeout(impactLoop, rnd(14000, 30000));
  }, rnd(4000, 8000));
})();
