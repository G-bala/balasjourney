import { useState, useEffect, useRef } from "react";
import { Radio, Cpu, Zap, Globe, ChevronDown, Activity, Layers, Wifi, BarChart3, Code2, ArrowRight, Signal, Database } from "lucide-react";

const NAV_LINKS = ["Mission", "Architecture", "Technology", "Results"];

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

// ─── SKY + STORM CANVAS — intensity driven by real Kp ────────────────────
function SkyBackground() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const tRef = useRef(0);
  const kpRef = useRef(2);
  const flareRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const ctx = canvas.getContext("2d");

    const particles = Array.from({ length: 220 }, () => ({
      x: window.innerWidth * (0.76 + Math.random() * 0.22),
      y: window.innerHeight * (Math.random() * 0.28),
      vx: -(Math.random() * 1.6 + 0.4),
      vy: (Math.random() - 0.5) * 0.45,
      life: Math.random(),
      maxLife: Math.random() * 0.7 + 0.3,
      size: Math.random() * 2.5 + 0.5,
      hue: Math.random() * 40 + 15,
    }));

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const t = (tRef.current += 0.007);
      const liveKp = Math.min(kpRef.current ?? 0, 9);
      const liveFI = Math.min(flareRef.current ?? 0, 10);
      // Normalize 0–1 storm intensity
      const stormI = Math.min(liveKp / 9, 1);
      const flareI = Math.min(liveFI / 10, 1);
      const cmePhase = (Math.sin(t * (0.3 + stormI * 0.4)) + 1) * 0.5;

      ctx.clearRect(0, 0, W, H);

      // Sky gradient — intensifies orange/red near top during storm
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      const stormR = Math.round(stormI * 40);
      skyGrad.addColorStop(0.00, `rgb(${1 + stormR},${3 + stormR / 4},${15})`);
      skyGrad.addColorStop(0.07, `rgb(${7 + stormR},${12},${30})`);
      skyGrad.addColorStop(0.16, "#0b2050");
      skyGrad.addColorStop(0.28, "#0d4a9e");
      skyGrad.addColorStop(0.42, "#1668c4");
      skyGrad.addColorStop(0.57, "#2e8fd8");
      skyGrad.addColorStop(0.70, "#5ab5e8");
      skyGrad.addColorStop(0.83, "#98d4f2");
      skyGrad.addColorStop(0.93, "#c8e9f8");
      skyGrad.addColorStop(1.00, "#e8f5fb");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Ionospheric layers
      const ionoLayers = [
        { yFrac: 0.05, color: [160, 100, 255], alpha: 0.14 + stormI * 0.1, thick: H * 0.04 },
        { yFrac: 0.13, color: [100, 60, 255],  alpha: 0.20 + stormI * 0.12, thick: H * 0.06 },
        { yFrac: 0.23, color: [60, 120, 255],  alpha: 0.17 + stormI * 0.08, thick: H * 0.055 },
        { yFrac: 0.33, color: [20, 190, 215],  alpha: 0.16 + stormI * 0.07, thick: H * 0.055 },
        { yFrac: 0.44, color: [50, 170, 255],  alpha: 0.10 + stormI * 0.05, thick: H * 0.08 },
        { yFrac: 0.57, color: [90, 200, 235],  alpha: 0.08 + stormI * 0.04, thick: H * 0.10 },
      ];

      ionoLayers.forEach(({ yFrac, color: [r, g, b], alpha, thick }) => {
        const cy = yFrac * H;
        const waveAmp = 7 + stormI * 14; // layers ripple more during storm
        const bandGrad = ctx.createLinearGradient(0, cy - thick * 0.6, 0, cy + thick * 0.6);
        bandGrad.addColorStop(0,    `rgba(${r},${g},${b},0)`);
        bandGrad.addColorStop(0.35, `rgba(${r},${g},${b},${alpha})`);
        bandGrad.addColorStop(0.65, `rgba(${r},${g},${b},${alpha})`);
        bandGrad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.moveTo(0, cy - thick * 0.6);
        for (let x = 0; x <= W; x += 6) {
          const wave = Math.sin(x * 0.005 + t * (0.6 + stormI)) * waveAmp + Math.sin(x * 0.011 - t * 0.4) * 4;
          ctx.lineTo(x, cy - thick * 0.6 + wave);
        }
        for (let x = W; x >= 0; x -= 6) {
          const wave = Math.sin(x * 0.005 + t * (0.6 + stormI)) * waveAmp + Math.sin(x * 0.011 - t * 0.4) * 4;
          ctx.lineTo(x, cy + thick * 0.6 + wave);
        }
        ctx.closePath();
        ctx.fillStyle = bandGrad;
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        for (let x = 0; x <= W; x += 4) {
          const wave = Math.sin(x * 0.005 + t * (0.6 + stormI)) * waveAmp + Math.sin(x * 0.011 - t * 0.4) * 4;
          if (x === 0) ctx.moveTo(x, cy + wave); else ctx.lineTo(x, cy + wave);
        }
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 2.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });

      // Aurora — more intense and wider at high Kp
      const aurCount = 4 + Math.round(stormI * 4);
      for (let ai = 0; ai < aurCount; ai++) {
        const auroraX = W * (0.04 + ai * (0.9 / aurCount));
        const auroraW = W * (0.14 + stormI * 0.08);
        for (let x = auroraX; x < auroraX + auroraW; x += 3) {
          const nx = (x - auroraX) / auroraW;
          const wave = Math.sin(nx * Math.PI * 3 + t * (0.8 + stormI * 0.5) + ai * 1.2) * (20 + stormI * 30);
          const hue = 155 + ai * 35 + Math.sin(t * 0.7 + ai) * 25 - stormI * 20;
          const aGrad = ctx.createLinearGradient(x, 0, x, H * (0.5 + stormI * 0.2));
          const baseA = 0.08 + stormI * 0.18;
          aGrad.addColorStop(0,    `hsla(${hue},85%,65%,0)`);
          aGrad.addColorStop(0.1,  `hsla(${hue},95%,70%,${baseA})`);
          aGrad.addColorStop(0.3,  `hsla(${hue},90%,65%,${baseA * 1.6})`);
          aGrad.addColorStop(0.55, `hsla(${hue},80%,60%,${baseA * 0.7})`);
          aGrad.addColorStop(1,    `hsla(${hue},70%,55%,0)`);
          ctx.fillStyle = aGrad;
          ctx.fillRect(x + wave, 0, 3, H * (0.65 + stormI * 0.2));
        }
      }

      // Sun
      const sunX = W * 0.87, sunY = H * 0.07;
      const sunR = Math.min(W, H) * 0.085;

      for (let gi = 7; gi >= 1; gi--) {
        const cr = sunR * (1 + gi * (0.75 + flareI * 0.3));
        const a = (0.032 + flareI * 0.02) / gi;
        const cGrad = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, cr);
        cGrad.addColorStop(0,   `rgba(255,${215 - flareI * 30},60,${a * 5})`);
        cGrad.addColorStop(0.4, `rgba(255,${160 - flareI * 20},20,${a * 2})`);
        cGrad.addColorStop(1,   "rgba(255,80,0,0)");
        ctx.fillStyle = cGrad;
        ctx.beginPath(); ctx.arc(sunX, sunY, cr, 0, Math.PI * 2); ctx.fill();
      }

      const innerCorona = ctx.createRadialGradient(sunX, sunY, sunR * 0.8, sunX, sunY, sunR * (2.2 + flareI * 0.5));
      innerCorona.addColorStop(0,   `rgba(255,${240 - flareI * 40},120,${0.55 + flareI * 0.2})`);
      innerCorona.addColorStop(0.4, `rgba(255,${180 - flareI * 30},40,${0.25 + flareI * 0.1})`);
      innerCorona.addColorStop(1,   "rgba(255,100,0,0)");
      ctx.fillStyle = innerCorona;
      ctx.beginPath(); ctx.arc(sunX, sunY, sunR * (2.2 + flareI * 0.5), 0, Math.PI * 2); ctx.fill();

      const disc = ctx.createRadialGradient(sunX - sunR * 0.25, sunY - sunR * 0.25, 0, sunX, sunY, sunR);
      disc.addColorStop(0,   "#fffef0");
      disc.addColorStop(0.35, `rgb(255,${248 - flareI * 20},${200 - flareI * 30})`);
      disc.addColorStop(0.7,  `rgb(255,${220 - flareI * 30},${40 - flareI * 5})`);
      disc.addColorStop(1,    `rgb(255,${150 - flareI * 30},0)`);
      ctx.fillStyle = disc;
      ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();

      // Prominences — more and taller with storm
      const promCount = 5 + Math.round(stormI * 4);
      for (let pi = 0; pi < promCount; pi++) {
        const pBase = (pi / promCount) * Math.PI * 2 + t * (0.12 + stormI * 0.08);
        const pR = sunR * (1.05 + Math.sin(t * 0.9 + pi * 1.3) * (0.1 + stormI * 0.2));
        const arcSpread = 0.28 + Math.sin(t * 0.6 + pi) * 0.08;
        const px1 = sunX + Math.cos(pBase - arcSpread) * pR;
        const py1 = sunY + Math.sin(pBase - arcSpread) * pR;
        const px2 = sunX + Math.cos(pBase + arcSpread) * pR;
        const py2 = sunY + Math.sin(pBase + arcSpread) * pR;
        const loopH = pR * (0.55 + stormI * 0.5 + Math.sin(t * 0.7 + pi) * 0.25);
        const cpx = sunX + Math.cos(pBase) * (pR + loopH);
        const cpy = sunY + Math.sin(pBase) * (pR + loopH);
        ctx.beginPath();
        ctx.moveTo(px1, py1);
        ctx.quadraticCurveTo(cpx, cpy, px2, py2);
        ctx.strokeStyle = `rgba(255,${80 + pi * 20 - stormI * 30},${pi * 8},${0.5 + stormI * 0.3})`;
        ctx.lineWidth = 2.5 + stormI * 1.5;
        ctx.shadowBlur = 12 + stormI * 8;
        ctx.shadowColor = `rgba(255,${100 - stormI * 50},0,0.6)`;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // CME jets — size/speed driven by Kp
      const cmeJetAngles = [Math.PI + 0.45, Math.PI + 0.65, Math.PI + 0.85];
      cmeJetAngles.forEach((jetAngle, ji) => {
        const jetLen = sunR * (3.5 + cmePhase * (4 + stormI * 6) - ji * 0.4);
        const spread = 0.18 - ji * 0.04;
        const jGrad = ctx.createLinearGradient(sunX, sunY, sunX + Math.cos(jetAngle) * jetLen, sunY + Math.sin(jetAngle) * jetLen);
        jGrad.addColorStop(0,    `rgba(255,${200 - stormI * 60},60,${0.7 - ji * 0.15})`);
        jGrad.addColorStop(0.25, `rgba(255,${130 - stormI * 40},20,${0.45 - ji * 0.1})`);
        jGrad.addColorStop(0.6,  `rgba(255,${60 - stormI * 20},0,${0.18 - ji * 0.05})`);
        jGrad.addColorStop(1,    "rgba(200,20,0,0)");
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX + Math.cos(jetAngle - spread) * jetLen, sunY + Math.sin(jetAngle - spread) * jetLen);
        ctx.arc(sunX, sunY, jetLen, jetAngle - spread, jetAngle + spread);
        ctx.lineTo(sunX, sunY);
        ctx.closePath();
        ctx.fillStyle = jGrad;
        ctx.fill();
        ctx.restore();
      });

      // Shockwave rings — frequency increases with Kp
      for (let ri = 0; ri < 2 + Math.round(stormI * 2); ri++) {
        const rPhase = ((cmePhase + ri * 0.33) % 1);
        const rR = sunR * (1.8 + rPhase * (5 + stormI * 4));
        const rAlpha = (1 - rPhase) * (0.22 + stormI * 0.15);
        const rGrad = ctx.createRadialGradient(sunX, sunY, rR * 0.9, sunX, sunY, rR * 1.1);
        rGrad.addColorStop(0,   "rgba(255,160,40,0)");
        rGrad.addColorStop(0.5, `rgba(255,${140 - stormI * 40},30,${rAlpha})`);
        rGrad.addColorStop(1,   "rgba(255,80,0,0)");
        ctx.fillStyle = rGrad;
        ctx.beginPath(); ctx.arc(sunX, sunY, rR * 1.1, 0, Math.PI * 2); ctx.fill();
      }

      // Solar wind particles — speed/count scales with Kp
      const speedMult = 1 + stormI * 3.5;
      particles.forEach((p) => {
        p.x += p.vx * speedMult;
        p.y += p.vy;
        p.life += 0.007;
        if (p.life > p.maxLife || p.x < -10) {
          p.x = sunX + (Math.random() - 0.5) * sunR * 2.5;
          p.y = sunY + (Math.random() - 0.5) * sunR * 2.5;
          p.life = 0;
          p.maxLife = Math.random() * 0.7 + 0.3;
        }
        const lr = p.life / p.maxLife;
        const alpha = lr < 0.2 ? lr / 0.2 : lr > 0.75 ? (1 - lr) / 0.25 : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - lr * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue + lr * 25 + stormI * 30},90%,72%,${alpha * (0.6 + stormI * 0.3)})`;
        ctx.fill();
      });

      // Global storm tint
      const stormTint = ctx.createRadialGradient(sunX, H * 0.12, sunR, W * 0.3, H * 0.2, W);
      stormTint.addColorStop(0,   `rgba(255,${140 - stormI * 80},20,${0.04 + stormI * 0.12})`);
      stormTint.addColorStop(0.35, `rgba(255,${80 - stormI * 50},10,${0.02 + stormI * 0.07})`);
      stormTint.addColorStop(0.7,  "rgba(180,20,0,0.01)");
      stormTint.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.fillStyle = stormTint;
      ctx.fillRect(0, 0, W, H);

      // Horizon glow
      const horizGrad = ctx.createLinearGradient(0, H * 0.72, 0, H);
      horizGrad.addColorStop(0,   "rgba(200,230,255,0)");
      horizGrad.addColorStop(0.5, "rgba(220,242,255,0.14)");
      horizGrad.addColorStop(1,   "rgba(255,252,245,0.28)");
      ctx.fillStyle = horizGrad;
      ctx.fillRect(0, H * 0.72, W, H * 0.28);

      // Layer labels
      const labelDefs = [
        { yFrac: 0.05, label: "EXOSPHERE",               color: [160,100,255] },
        { yFrac: 0.13, label: "THERMOSPHERE  F2 ~300km",  color: [100,60,255]  },
        { yFrac: 0.23, label: "THERMOSPHERE  F1 ~180km",  color: [60,120,255]  },
        { yFrac: 0.33, label: "MESOSPHERE  E ~110km",     color: [20,190,215]  },
        { yFrac: 0.44, label: "STRATOSPHERE ~50km",       color: [50,170,255]  },
        { yFrac: 0.57, label: "TROPOSPHERE ~12km",        color: [90,200,235]  },
      ];
      ctx.save();
      labelDefs.forEach(({ yFrac, label, color: [r, g, b] }) => {
        const cy = yFrac * H;
        ctx.fillStyle = `rgba(${r},${g},${b},0.82)`;
        ctx.font = `bold 9.5px 'Courier New', monospace`;
        ctx.fillText(label, 14, cy - 7);
        ctx.setLineDash([3, 7]);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.22)`;
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
        ctx.setLineDash([]);
      });
      ctx.restore();

      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
}

const glass = {
  background: "rgba(3,9,24,0.72)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.07)",
};

function FlowDiagram() {
  const steps = [
    { label: "Pulse Coding",    sub: "Waveform Gen",   icon: Code2,     color: "#38bdf8" },
    { label: "SDR Transmitter", sub: "RF Output",       icon: Radio,     color: "#22d3ee" },
    { label: "Ionosphere",      sub: "150 – 700 km",   icon: Layers,    color: "#a78bfa" },
    { label: "Reflection",      sub: "Echo Return",     icon: Signal,    color: "#f472b6" },
    { label: "SDR Receiver",    sub: "Correlation",     icon: Cpu,       color: "#34d399" },
    { label: "PC Analysis",     sub: "Ionogram",        icon: BarChart3, color: "#fb923c" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-y-6">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          {/* Step box */}
          <div className="flex flex-col items-center gap-2 group">
            <div
              className="w-18 h-18 md:w-20 md:h-20 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110"
              style={{ background: s.color + "18", borderColor: s.color + "40", boxShadow: `0 0 18px ${s.color}18`, width: 76, height: 76 }}
            >
              <s.icon size={26} style={{ color: s.color }} />
            </div>
            <span className="text-xs font-bold text-center leading-tight" style={{ color: s.color, fontFamily: "'Space Mono', monospace", maxWidth: 80 }}>{s.label}</span>
            <span className="text-xs text-slate-400 text-center">{s.sub}</span>
          </div>
          {/* Arrow between steps — aligned to icon centre (icon 76px + padding-top to hit midpoint) */}
          {i < steps.length - 1 && (
            <div className="flex-shrink-0 mx-1 md:mx-3 self-start" style={{ paddingTop: 28 }}>
              <svg width="36" height="20" viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id={`ag${i}`} x1="0" y1="0" x2="36" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={steps[i].color} stopOpacity="0.6"/>
                    <stop offset="100%" stopColor={steps[i+1].color} stopOpacity="0.9"/>
                  </linearGradient>
                </defs>
                <line x1="0" y1="10" x2="26" y2="10" stroke={`url(#ag${i})`} strokeWidth="2" strokeLinecap="round"/>
                <polyline points="22,4 32,10 22,16" fill="none" stroke={steps[i+1].color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TechCard({icon:Icon,title,desc,accent}){return(<div className="relative rounded-2xl p-5 overflow-hidden" style={{...glass,borderColor:accent+"22"}}><div className="absolute inset-0 opacity-5" style={{background:`radial-gradient(circle at top right, ${accent}, transparent 65%)`}}/><div className="flex items-start gap-4"><div className="rounded-xl p-2.5 flex-shrink-0" style={{background:accent+"20"}}><Icon size={22} style={{color:accent}}/></div><div className="flex-1 min-w-0"><h3 className="font-bold text-white text-sm" style={{fontFamily:"'Space Mono', monospace"}}>{title}</h3><p className="text-slate-400 text-sm mt-1 leading-relaxed">{desc}</p></div></div></div>);}

function BentoCard({icon:Icon,title,sub,desc,color,wide}){return(<div className={`rounded-2xl p-6 relative overflow-hidden flex flex-col gap-3 ${wide?"md:col-span-2":""}`} style={{...glass}}><div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl" style={{background:color,transform:"translate(25%,-25%)"}}/><div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:color+"20"}}><Icon size={24} style={{color}}/></div><div><h3 className="font-bold text-white mb-1 text-sm" style={{fontFamily:"'Space Mono', monospace"}}>{title}</h3>{sub&&<p className="text-xs font-semibold mb-1" style={{color:color+"cc",fontFamily:"'Space Mono', monospace"}}>{sub}</p>}<p className="text-slate-400 text-sm leading-relaxed">{desc}</p></div></div>);}

// ─── CUSTOM CURSOR ────────────────────────────────────────────────────────
function CustomCursor() {
  const cursorRef = useRef(null);
  const thunderRef = useRef(null);
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top  = e.clientY + "px";
      }
      if (thunderRef.current) {
        thunderRef.current.style.left = e.clientX + "px";
        thunderRef.current.style.top  = e.clientY + "px";
      }
    };

    const checkPointer = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;
      const style = window.getComputedStyle(el);
      const tag = el.tagName.toLowerCase();
      const isClick = style.cursor === "pointer" ||
        tag === "button" || tag === "a" ||
        el.closest("button") || el.closest("a") ||
        el.getAttribute("role") === "button";
      setIsPointer(!!isClick);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mousemove", checkPointer);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousemove", checkPointer);
    };
  }, []);

  return (
    <>
      {/* Main cursor — small white cloud shape */}
      <div
        ref={cursorRef}
        style={{
          position: "fixed",
          pointerEvents: "none",
          zIndex: 99999,
          transform: "translate(-50%, -50%)",
          transition: "transform 0.08s ease, opacity 0.15s ease",
        }}
      >
        <svg
          width={isPointer ? 32 : 26}
          height={isPointer ? 22 : 18}
          viewBox="0 0 32 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transition: "width 0.15s ease, height 0.15s ease",
            filter: isPointer
              ? "drop-shadow(0 0 6px rgba(0,0,0,0.9))"
              : "drop-shadow(0 1px 4px rgba(0,0,0,0.5))",
          }}
        >
          {/* Cloud shape */}
          <path
            d="M8 18 C4 18 1 15 1 12 C1 9.5 2.8 7.4 5.2 6.8 C5.1 6.4 5 6 5 5.5 C5 3 7 1 9.5 1 C11 1 12.3 1.7 13.1 2.8 C13.9 2.3 14.9 2 16 2 C19.3 2 22 4.7 22 8 C22 8.3 22 8.6 21.9 8.9 C23.7 9.5 25 11.1 25 13 C25 15.2 23.2 17 21 17 L8 18 Z"
            fill={isPointer ? "#111111" : "#ffffff"}
            stroke={isPointer ? "#000000" : "rgba(200,220,255,0.6)"}
            strokeWidth="0.8"
            style={{ transition: "fill 0.15s ease, stroke 0.15s ease" }}
          />
          {/* Small puff bumps on top */}
          <circle cx="10" cy="6" r="3.5"
            fill={isPointer ? "#111111" : "#ffffff"}
            stroke={isPointer ? "#000000" : "rgba(200,220,255,0.4)"}
            strokeWidth="0.6"
            style={{ transition: "fill 0.15s ease" }}
          />
          <circle cx="16" cy="4.5" r="4"
            fill={isPointer ? "#111111" : "#ffffff"}
            stroke={isPointer ? "#000000" : "rgba(200,220,255,0.4)"}
            strokeWidth="0.6"
            style={{ transition: "fill 0.15s ease" }}
          />
          <circle cx="21" cy="7" r="3"
            fill={isPointer ? "#111111" : "#ffffff"}
            stroke={isPointer ? "#000000" : "rgba(200,220,255,0.4)"}
            strokeWidth="0.6"
            style={{ transition: "fill 0.15s ease" }}
          />
        </svg>
      </div>

      {/* Thunder bolt — only visible on hover over clickable */}
      <div
        ref={thunderRef}
        style={{
          position: "fixed",
          pointerEvents: "none",
          zIndex: 99998,
          transform: "translate(-50%, 8px)",
          opacity: isPointer ? 1 : 0,
          transition: "opacity 0.15s ease, transform 0.15s ease",
        }}
      >
        <svg width="14" height="22" viewBox="0 0 14 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bolt" x1="7" y1="0" x2="7" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="60%" stopColor="#ffe066"/>
              <stop offset="100%" stopColor="#ffaa00" stopOpacity="0"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <polygon
            points="9,1 3,12 7,12 5,21 11,10 7,10 9,1"
            fill="url(#bolt)"
            filter="url(#glow)"
          />
        </svg>
      </div>
    </>
  );
}

export default function AISP(){
  const scrollY = useScrollY();
  const scrollTo=(id)=>document.getElementById(id.toLowerCase())?.scrollIntoView({behavior:"smooth"});

  const techCards=[
    {icon:Activity,title:"Coded Pulse Radar",accent:"#22d3ee",desc:"Complementary Golay 16 waveform for high-resolution range measurement via complex correlation.",detail:"AISP transmits complementary Golay 16 coded pulse sequences — a pair of complementary codes each 16 chips long whose autocorrelation sidelobes cancel perfectly when summed. This achieves range resolution far beyond a simple pulse while maintaining the average power needed for long-range ionospheric sounding. The matched filter correlator compresses the received echo into a sharp, zero-sidelobe peak with maximised SNR."},
    {icon:Cpu,title:"SDR-Based DSP",accent:"#34d399",desc:"Real-time signal processing, filtering, and decimation in programmable fabric.",detail:"The SDR platform handles digital down-conversion, low-pass filtering, and decimation in real time. Custom FPGA logic and C++ host code manage timing and data pipeline, ensuring coherent processing across the full 1–30 MHz sweep."},
    {icon:BarChart3,title:"2D-CA-CFAR Algorithm",accent:"#a78bfa",desc:"Constant False Alarm Rate detection of ionospheric echoes against noise.",detail:"The two-dimensional Cell-Averaging CFAR processor slides a window over the frequency–height ionogram matrix, estimating local noise statistics. Echoes exceeding an adaptive threshold are reliably flagged — distinguishing true reflections from HF interference."},
    {icon:Zap,title:"Programmable Waveforms",accent:"#fb923c",desc:"Software-switchable pulse patterns.",detail:"Unlike legacy hardware ionosondes, AISP generates arbitrary pulse shapes and frequency hopping sequences in software. Sweep rate, pulse width, coding scheme, and RF power are all reconfigurable from a single config file."},
  ];
  const bentoItems=[
    {icon:Radio,title:"SDR Core",color:"#22d3ee",desc:"Acts as both transmitter and receiver, handling RF signal generation, timing control, and coherent I/Q data acquisition across 1–30 MHz."},
    {icon:Zap,title:"Pulse Compression Engine",sub:"Complementary coded pulse",color:"#34d399",desc:"Coded pulse radar techniques dramatically improve SNR, enabling detection of weak ionospheric echoes that traditional ionosondes miss."},
    {icon:Wifi,title:"Ethernet Interface",color:"#38bdf8",wide:true,desc:"High-speed PC-to-SDR Ethernet link allows flexible configuration, remote deployment, and near-real-time data streaming to analysis nodes."},
    {icon:Database,title:"Power & Antenna Control",color:"#f472b6",desc:"Integrated management of RF power amplifiers and specialized antenna arrays ensures coordinated transmission with optimal radiated power."},
  ];
  const stack=[
    {cat:"Hardware",items:["SDR Platforms (USRP N-series)","Custom RF Power Amplifiers","Broadband Antenna Arrays"]},
    {cat:"Software",items:["C++ Host Control Layer","Python Analysis Pipeline","GNU Radio / UHD Drivers"]},
    {cat:"Methodology",items:["Vertical Ionospheric Sounding","Pulse Compression","2D Complex Correlation"]},
  ];
  const sectionStyle={background:"rgba(2,7,18,0.54)",backdropFilter:"blur(4px)"};

  return(
    <div className="min-h-screen text-white selection:bg-teal-500/30 relative" style={{fontFamily:"'DM Sans', 'Segoe UI', sans-serif"}}>

      <CustomCursor/>
      <SkyBackground/>

      <div className="relative" style={{zIndex:10}}>

        {/* NAV */}
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500" style={{background:scrollY>60?"rgba(3,9,24,0.88)":"transparent",backdropFilter:scrollY>60?"blur(20px)":"none",borderBottom:scrollY>60?"1px solid rgba(20,184,166,0.12)":"none"}}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"rgba(20,184,166,0.2)"}}><Radio size={16} className="text-teal-400"/></div>
              <span className="font-bold text-teal-300 tracking-widest text-sm" style={{fontFamily:"'Space Mono', monospace"}}>AISP</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(n=>(<button key={n} onClick={()=>scrollTo(n)} className="text-sm text-slate-200 hover:text-teal-300 transition-colors tracking-wide drop-shadow" style={{fontFamily:"'Space Mono', monospace"}}>{n}</button>))}
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="relative min-h-screen flex flex-col justify-center px-6 pt-24">
          <div className="max-w-6xl mx-auto w-full">
            <div className="lg:w-3/5">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs tracking-widest" style={{background:"rgba(20,184,166,0.13)",border:"1px solid rgba(20,184,166,0.38)",color:"#5eead4",fontFamily:"'Space Mono', monospace"}}>
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"/>
                SDR-BASED IONOSPHERIC SOUNDER · DEVELOPED AT INGV, ITALY
              </div>
              <h1 className="text-5xl md:text-7xl font-black leading-none mb-6" style={{fontFamily:"'Space Grotesk', 'DM Sans', sans-serif",letterSpacing:"-0.03em",textShadow:"0 2px 20px rgba(0,0,0,0.7)"}}>
                <span className="text-white">AISP</span><br/>
                <span style={{background:"linear-gradient(135deg, #22d3ee, #818cf8, #34d399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Next-Gen</span><br/>
                <span className="text-white">Ionosonde</span>
              </h1>
              <p className="text-slate-100 text-lg leading-relaxed mb-10 max-w-xl" style={{textShadow:"0 1px 10px rgba(0,0,0,0.7)"}}>
                An SDR-based, fully programmable pulse compression ionosonde for real-time vertical ionospheric surveys. Developed and validated at <strong class="text-teal-300">INGV</strong> — the National Institute of Geophysics and Volcanology, Italy.
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={()=>scrollTo("Mission")} className="px-8 py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 hover:scale-105" style={{background:"linear-gradient(135deg, #0d9488, #0284c7)",boxShadow:"0 0 32px rgba(20,184,166,0.4)",fontFamily:"'Space Mono', monospace"}}>EXPLORE PROJECT</button>
                <button onClick={()=>scrollTo("Architecture")} className="px-8 py-3 rounded-xl font-bold text-sm tracking-wide text-slate-200 hover:text-white transition-all duration-300" style={{...glass,fontFamily:"'Space Mono', monospace"}}>ARCHITECTURE</button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown size={20} className="text-slate-300 drop-shadow"/>
          </div>
        </section>

        {/* MISSION */}
        <section id="mission" className="relative py-28 px-6" style={sectionStyle}>
          <div className="max-w-6xl mx-auto">
            <div className="mb-16">
              <span className="text-teal-400 text-xs tracking-widest font-bold" style={{fontFamily:"'Space Mono', monospace"}}>01 / THE MISSION</span>
              <h2 className="text-4xl md:text-5xl font-black mt-3 mb-6" style={{letterSpacing:"-0.02em"}}>Redefining Ionospheric<br/><span style={{color:"#22d3ee"}}>Sounding</span></h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="rounded-2xl p-8" style={{...glass,borderColor:"rgba(239,68,68,0.25)"}}><div className="w-10 h-10 rounded-xl mb-5 flex items-center justify-center" style={{background:"rgba(239,68,68,0.15)"}}><span className="text-red-400 font-bold text-lg">✕</span></div><h3 className="text-xl font-bold text-white mb-3">The Challenge</h3><p className="text-slate-400 leading-relaxed">Traditional ionosondes rely on fixed, hardware-heavy architectures. Inflexible analog chains, proprietary waveform generators, and rigid operating modes make them difficult to adapt for evolving research needs.</p></div>
              <div className="rounded-2xl p-8" style={{...glass,borderColor:"rgba(20,184,166,0.25)"}}><div className="w-10 h-10 rounded-xl mb-5 flex items-center justify-center" style={{background:"rgba(20,184,166,0.15)"}}><span className="text-teal-400 font-bold text-lg">✓</span></div><h3 className="text-xl font-bold text-white mb-3">The Solution — AISP</h3><p className="text-slate-400 leading-relaxed">AISP was developed and validated at <strong class="text-teal-400">INGV — National Institute of Geophysics and Volcanology, Italy</strong>. It evolves the existing INGV AIS ionosonde by replacing bespoke hardware with SDR platforms that act as both transmitter and receiver, creating a fully software-reconfigurable ionosonde with unprecedented versatility.</p></div>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section id="architecture" className="relative py-28 px-6" style={{background:"rgba(2,7,18,0.48)",backdropFilter:"blur(3px)"}}>
          <div className="max-w-6xl mx-auto">
            <div className="mb-16"><span className="text-teal-400 text-xs tracking-widest font-bold" style={{fontFamily:"'Space Mono', monospace"}}>02 / ARCHITECTURE</span><h2 className="text-4xl md:text-5xl font-black mt-3 mb-6" style={{letterSpacing:"-0.02em"}}>System <span style={{color:"#22d3ee"}}>Design</span></h2></div>
            <div className="rounded-2xl p-8 mb-8" style={{...glass}}><div className="text-xs text-slate-500 mb-6 tracking-widest" style={{fontFamily:"'Space Mono', monospace"}}>SIGNAL PROCESSING CHAIN</div><FlowDiagram/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{bentoItems.map((b,i)=><BentoCard key={i} {...b}/>)}</div>
          </div>
        </section>

        {/* TECHNOLOGY */}
        <section id="technology" className="relative py-28 px-6" style={{background:"rgba(2,7,18,0.54)",backdropFilter:"blur(4px)"}}>
          <div className="max-w-6xl mx-auto">
            <div className="mb-16"><span className="text-teal-400 text-xs tracking-widest font-bold" style={{fontFamily:"'Space Mono', monospace"}}>03 / TECHNOLOGY</span><h2 className="text-4xl md:text-5xl font-black mt-3 mb-2" style={{letterSpacing:"-0.02em"}}>Key Technical <span style={{color:"#22d3ee"}}>Features</span></h2><p className="text-slate-400 text-sm">Click each card to expand technical details.</p></div>
            <div className="grid md:grid-cols-2 gap-4 mb-16">{techCards.map((c,i)=><TechCard key={i} {...c}/>)}</div>
            <div className="rounded-2xl p-8" style={{...glass}}><div className="text-xs text-slate-500 mb-8 tracking-widest" style={{fontFamily:"'Space Mono', monospace"}}>TECHNOLOGY STACK</div><div className="grid md:grid-cols-3 gap-8">{stack.map((s,i)=>(<div key={i}><div className="text-teal-400 text-xs font-bold mb-4 tracking-widest" style={{fontFamily:"'Space Mono', monospace"}}>{s.cat.toUpperCase()}</div><div className="space-y-2">{s.items.map((item,j)=>(<div key={j} className="flex items-center gap-2 text-sm text-slate-400"><div className="w-1 h-1 rounded-full bg-teal-500 flex-shrink-0"/>{item}</div>))}</div></div>))}</div></div>
          </div>
        </section>

        {/* RESULTS */}
        <section id="results" className="relative py-28 px-6" style={{background:"rgba(2,7,18,0.50)",backdropFilter:"blur(4px)"}}>
          <div className="max-w-6xl mx-auto">
            <div className="mb-16"><span className="text-teal-400 text-xs tracking-widest font-bold" style={{fontFamily:"'Space Mono', monospace"}}>04 / RESULTS</span><h2 className="text-4xl md:text-5xl font-black mt-3" style={{letterSpacing:"-0.02em"}}>Research <span style={{color:"#22d3ee"}}>Impact</span></h2></div>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[{stat:"< 1 km",label:"Virtual Height Resolution",color:"#22d3ee",sub:"Pulse compression derived"},{stat:"1–30",label:"MHz Sweep Range",color:"#34d399",sub:"Full HF band coverage"},{stat:"2D-CFAR",label:"Echo Detection",color:"#a78bfa",sub:"Adaptive noise estimation"}].map((m,i)=>(
                <div key={i} className="rounded-2xl p-8 text-center" style={{...glass,borderColor:m.color+"30"}}><div className="text-5xl font-black mb-2" style={{color:m.color,fontFamily:"'Space Mono', monospace"}}>{m.stat}</div><div className="text-white font-bold mb-1">{m.label}</div><div className="text-slate-500 text-sm">{m.sub}</div></div>
              ))}
            </div>
            <div className="rounded-2xl p-8" style={{...glass,borderColor:"rgba(20,184,166,0.22)"}}>
              <div className="flex items-start gap-4"><Globe size={24} className="text-teal-400 flex-shrink-0 mt-1"/><div><h3 className="text-xl font-bold text-white mb-3">Validated at INGV · Global Ionospheric Models</h3><p className="text-slate-400 leading-relaxed">AISP has been operationally validated at <strong className="text-teal-400">INGV — the National Institute of Geophysics and Volcanology, Italy</strong>, one of Europe's foremost Earth science research bodies. </p></div></div>
            </div>
          </div>
        </section>

        <footer className="py-14 px-6 text-center" style={{background:"rgba(2,7,18,0.85)",borderTop:"1px solid rgba(20,184,166,0.1)"}}>
          <div className="flex items-center justify-center gap-2 mb-3"><Radio size={16} className="text-teal-500"/><span className="text-teal-500 font-bold tracking-widest text-sm" style={{fontFamily:"'Space Mono', monospace"}}>AISP</span></div>
          <p className="text-slate-600 text-xs tracking-wide mb-8">Advanced Ionospheric Sounder Programmable · Developed & Validated at INGV, Italy</p>
          <div className="max-w-lg mx-auto rounded-2xl p-6" style={{background:"rgba(20,184,166,0.06)",border:"1px solid rgba(20,184,166,0.2)"}}>
            <p className="text-slate-400 text-sm mb-1">Want to learn more about AISP?</p>
            <p className="text-slate-500 text-xs mb-4">Read the full peer-reviewed research paper published in <span className="text-slate-300 font-semibold">Advances in Space Research</span></p>
            <a
              href="https://doi.org/10.1016/j.asr.2025.04.072"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 hover:scale-105"
              style={{background:"linear-gradient(135deg,#0d9488,#0284c7)",boxShadow:"0 0 24px rgba(20,184,166,0.3)",fontFamily:"'Space Mono', monospace",color:"#fff"}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              SEE THE PAPER
            </a>
            <p className="text-slate-600 text-xs mt-4" style={{fontFamily:"'Space Mono', monospace"}}>doi.org/10.1016/j.asr.2025.04.072</p>
          </div>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;700;900&family=Space+Grotesk:wght@700;900&display=swap');
        * { cursor: none !important; }
      `}</style>
    </div>
  );
}
