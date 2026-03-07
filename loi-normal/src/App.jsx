import { useState, useEffect, useRef } from 'react'
import './App.css'

// ─── Error Function (erf) approximation ───────────────────────────────────────
function erf(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// Φ(x) = CDF of N(0,1)
function phi(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

// Inverse Φ (Newton-Raphson)
function phiInverse(p) {
  let x = 0;
  for (let i = 0; i < 100; i++) {
    const fx = phi(x) - p;
    const fpx = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    x -= fx / fpx;
  }
  return x;
}

// Normal PDF
function normalPDF(x, mu, sigma) {
  return Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}

// ─── Bell Curve SVG ────────────────────────────────────────────────────────────
function BellCurve({ mu, sigma, a, b, width = 500, height = 160 }) {
  const pts = [];
  const lo = mu - 4 * sigma;
  const hi = mu + 4 * sigma;
  const steps = 300;

  for (let i = 0; i <= steps; i++) {
    const x = lo + (i / steps) * (hi - lo);
    const y = normalPDF(x, mu, sigma);
    pts.push([x, y]);
  }

  const maxY = Math.max(...pts.map(([, y]) => y));
  const pad = { l: 30, r: 30, t: 20, b: 30 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;

  const sx = (x) => pad.l + ((x - lo) / (hi - lo)) * W;
  const sy = (y) => pad.t + H - (y / (maxY * 1.1)) * H;

  const pathAll = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${sx(x)},${sy(y)}`).join(" ");

  // Shaded region
  const aClamp = Math.max(lo, a);
  const bClamp = Math.min(hi, b);
  const shadePts = pts.filter(([x]) => x >= aClamp && x <= bClamp);
  let shadePath = "";
  if (shadePts.length > 1) {
    shadePath = `M${sx(aClamp)},${sy(0)} ` +
      shadePts.map(([x, y]) => `L${sx(x)},${sy(y)}`).join(" ") +
      ` L${sx(bClamp)},${sy(0)} Z`;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ fontFamily: "'DM Mono', monospace" }}>
      <defs>
        <linearGradient id="shadeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={pad.l} x2={pad.l + W} y1={sy(maxY * f)} y2={sy(maxY * f)}
          stroke="#1e3a4a" strokeWidth="0.5" strokeDasharray="3,3" />
      ))}
      {/* Shaded area */}
      {shadePath && <path d={shadePath} fill="url(#shadeGrad)" />}
      {/* Curve */}
      <path d={pathAll} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      {/* Axis */}
      <line x1={pad.l} x2={pad.l + W} y1={sy(0)} y2={sy(0)} stroke="#334155" strokeWidth="1" />
      {/* μ label */}
      <text x={sx(mu)} y={sy(0) + 16} textAnchor="middle" fontSize="10" fill="#64748b">μ={mu}</text>
      {/* a, b markers */}
      {a > lo && a < hi && (
        <>
          <line x1={sx(a)} x2={sx(a)} y1={sy(0)} y2={sy(normalPDF(a, mu, sigma))} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,2" />
          <text x={sx(a)} y={sy(0) + 16} textAnchor="middle" fontSize="10" fill="#f59e0b">{a}</text>
        </>
      )}
      {b > lo && b < hi && (
        <>
          <line x1={sx(b)} x2={sx(b)} y1={sy(0)} y2={sy(normalPDF(b, mu, sigma))} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,2" />
          <text x={sx(b)} y={sy(0) + 16} textAnchor="middle" fontSize="10" fill="#f59e0b">{b}</text>
        </>
      )}
    </svg>
  );
}

// ─── Step display ──────────────────────────────────────────────────────────────
function Step({ num, label, children }) {
  return (
    <div className="flex gap-3 items-start">
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0, margin: "5px auto"
      }}>{num}</div>
      <div className="flex-1">
        <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
        <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Part A ────────────────────────────────────────────────────────────────────
function PartA() {
  const [mu, setMu] = useState(5);
  const [variance, setVariance] = useState(4);
  const [a, setA] = useState(2);
  const [b, setB] = useState(6);
  const [result, setResult] = useState(null);

  const sigma = Math.sqrt(variance);

  const calculate = () => {
    const za = (a - mu) / sigma;
    const zb = (b - mu) / sigma;
    const prob = phi(zb) - phi(za);
    setResult({ za, zb, phiA: phi(za), phiB: phi(zb), prob });
  };

  useEffect(() => { calculate(); }, [mu, variance, a, b]);

  const fmt = (n) => n.toFixed(4);
  const fmtZ = (n) => (n >= 0 ? "+" : "") + n.toFixed(4);

  return (
    <div>
      <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
        Soit <b style={{ color: "#38bdf8" }}>X ~ N(μ, σ²)</b>. Calculer <b style={{ color: "#f59e0b" }}>P[a &lt; X &lt; b]</b>.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Moyenne μ", val: mu, set: setMu, min: -100, max: 100 },
          { label: "Variance σ²", val: variance, set: setVariance, min: 0.1, max: 100, step: 0.1 },
          { label: "Borne gauche a", val: a, set: setA, min: -100, max: 100 },
          { label: "Borne droite b", val: b, set: setB, min: -100, max: 100 },
        ].map(({ label, val, set, min, max, step = 1 }) => (
          <label key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
            <input type="number" value={val} step={step} min={min} max={max}
              onChange={(e) => set(parseFloat(e.target.value) || 0)}
              style={{
                background: "#0f1f2e", border: "1px solid #1e3a4a", borderRadius: 8,
                color: "#e2e8f0", padding: "8px 12px", fontSize: 14,
                outline: "none", width: "100%"
              }} />
          </label>
        ))}
      </div>

      {/* Bell curve */}
      <div style={{ background: "#0a1828", borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <BellCurve mu={mu} sigma={sigma} a={a} b={b} />
      </div>

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Step num="1" label="Standardisation">
            Z = (X − μ) / σ = (X − {mu}) / {fmt(sigma)}<br />
            z₁ = ({a} − {mu}) / {fmt(sigma)} = <b style={{ color: "#f59e0b" }}>{fmtZ(result.za)}</b><br />
            z₂ = ({b} − {mu}) / {fmt(sigma)} = <b style={{ color: "#f59e0b" }}>{fmtZ(result.zb)}</b>
          </Step>
          <Step num="2" label="Table de la loi normale">
            Φ({fmtZ(result.zb)}) = <b style={{ color: "#38bdf8" }}>{fmt(result.phiB)}</b><br />
            Φ({fmtZ(result.za)}) = <b style={{ color: "#38bdf8" }}>{fmt(result.phiA)}</b>
          </Step>
          <Step num="3" label="Résultat">
            P[{a} &lt; X &lt; {b}] = Φ({fmtZ(result.zb)}) − Φ({fmtZ(result.za)})<br />
            = {fmt(result.phiB)} − {fmt(result.phiA)}<br />
            = <b style={{ color: "#4ade80", fontSize: 18 }}>{fmt(result.prob)}</b>
            <span style={{ marginLeft: 8, color: "#94a3b8", fontSize: 12 }}>
              soit {(result.prob * 100).toFixed(2)} %
            </span>
          </Step>
        </div>
      )}
    </div>
  );
}

// ─── Part B ────────────────────────────────────────────────────────────────────
function PartB() {
  const [x1, setX1] = useState(5);
  const [p1, setP1] = useState(0.1587);
  const [x2, setX2] = useState(20);
  const [p2, setP2] = useState(0.9772);
  const [result, setResult] = useState(null);

  const calculate = () => {
    const z1 = phiInverse(p1);
    const z2 = phiInverse(p2);
    // x1 = mu + z1*sigma  =>  mu + z1*sigma = x1
    // x2 = mu + z2*sigma  =>  mu + z2*sigma = x2
    // Subtracting: (z2 - z1)*sigma = x2 - x1
    const sigma = (x2 - x1) / (z2 - z1);
    const mu = x1 - z1 * sigma;
    setResult({ z1, z2, mu, sigma, sigma2: sigma * sigma });
  };

  useEffect(() => { calculate(); }, [x1, p1, x2, p2]);

  const fmt = (n) => n.toFixed(4);
  const fmtZ = (n) => (n >= 0 ? "+" : "") + n.toFixed(4);

  return (
    <div>
      <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
        Déterminer <b style={{ color: "#38bdf8" }}>μ</b> et <b style={{ color: "#38bdf8" }}>σ</b> d'une loi normale Y à partir de deux probabilités connues.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "x₁", val: x1, set: setX1 },
          { label: "P[Y < x₁]", val: p1, set: setP1, step: 0.0001, min: 0.0001, max: 0.9999 },
          { label: "x₂", val: x2, set: setX2 },
          { label: "P[Y < x₂]", val: p2, set: setP2, step: 0.0001, min: 0.0001, max: 0.9999 },
        ].map(({ label, val, set, step = 1, min = -1000, max = 1000 }) => (
          <label key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
            <input type="number" value={val} step={step} min={min} max={max}
              onChange={(e) => set(parseFloat(e.target.value) || 0)}
              style={{
                background: "#0f1f2e", border: "1px solid #1e3a4a", borderRadius: 8,
                color: "#e2e8f0", padding: "8px 12px", fontSize: 14, outline: "none", width: "100%"
              }} />
          </label>
        ))}
      </div>

      {result && !isNaN(result.mu) && isFinite(result.mu) && result.sigma > 0 && (
        <div>
          <div style={{ background: "#0a1828", borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <BellCurve mu={result.mu} sigma={result.sigma} a={x1} b={x2} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Step num="1" label="Trouver z₁ et z₂ via Φ⁻¹">
              Φ(z₁) = {p1} → z₁ = Φ⁻¹({p1}) = <b style={{ color: "#f59e0b" }}>{fmtZ(result.z1)}</b><br />
              Φ(z₂) = {p2} → z₂ = Φ⁻¹({p2}) = <b style={{ color: "#f59e0b" }}>{fmtZ(result.z2)}</b>
            </Step>
            <Step num="2" label="Système d'équations">
              <span style={{ color: "#c084fc" }}>
                ( {x1} − μ ) / σ = {fmtZ(result.z1)}<br />
                ( {x2} − μ ) / σ = {fmtZ(result.z2)}
              </span>
            </Step>
            <Step num="3" label="Résolution">
              σ = ({x2} − {x1}) / ({fmtZ(result.z2)} − {fmtZ(result.z1)}) = <b style={{ color: "#38bdf8" }}>{fmt(result.sigma)}</b><br />
              μ = {x1} − ({fmtZ(result.z1)}) × {fmt(result.sigma)} = <b style={{ color: "#38bdf8" }}>{fmt(result.mu)}</b>
            </Step>
            <div style={{
              background: "linear-gradient(135deg, #0f2d1a, #0a1828)",
              border: "1px solid #16a34a", borderRadius: 12, padding: 16,
              display: "flex", gap: 32, justifyContent: "center", marginTop: 4
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Moyenne</div>
                <div style={{ color: "#4ade80", fontSize: 28, fontWeight: 800 }}>μ = {fmt(result.mu)}</div>
              </div>
              <div style={{ width: 1, background: "#1e3a4a" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Écart-type</div>
                <div style={{ color: "#4ade80", fontSize: 28, fontWeight: 800 }}>σ = {fmt(result.sigma)}</div>
              </div>
              <div style={{ width: 1, background: "#1e3a4a" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Variance</div>
                <div style={{ color: "#4ade80", fontSize: 28, fontWeight: 800 }}>σ² = {fmt(result.sigma2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {

  const [tab, setTab] = useState("a");

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #0c1e30 0%, #060d14 100%)",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: "#e2e8f0",
      padding: "24px 16px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        input:focus { border-color: #0ea5e9 !important; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          marginBottom: 28,
          borderBottom: "1px solid #1e3a4a",
          paddingBottom: 20
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#f8fafc",
            textTransform: "uppercase"
          }}>Loi Normale</h1>
          <p style={{ color: "#1f2a3a", fontSize: 12, marginTop: 6 }}>
            Calculateur interactif — N(μ, σ²)
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { id: "a", label: "P[a < X < b]" },
            { id: "b", label: "Trouver μ & σ" },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: "10px 16px", borderRadius: 10, border: "none",
              cursor: "pointer", fontSize: 12, fontFamily: "'DM Mono', monospace",
              fontWeight: 500, transition: "all 0.2s",
              background: tab === id
                ? "linear-gradient(135deg, #0ea5e9, #6366f1)"
                : "#0f1f2e",
              color: tab === id ? "#fff" : "#64748b",
              boxShadow: tab === id ? "0 0 20px #0ea5e940" : "none"
            }}>{label}</button>
          ))}
        </div>

        {/* Content card */}
        <div style={{
          background: "rgba(15,31,46,0.8)", borderRadius: 16,
          border: "1px solid #1e3a4a", padding: 24,
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 40px rgba(0,0,0,0.5)"
        }}>
          {tab === "a" ? <PartA /> : <PartB />}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 20, color: "#1e3a4a", fontSize: 11 }}>
          Probabilités calculées via la fonction Φ (loi normale standard)
        </div>
      </div>
    </div>
  );
}

