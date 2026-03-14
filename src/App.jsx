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
function BellCurve({ mu, sigma, a, b, width = 500, height = 180 }) {
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
  const pad = { l: 40, r: 20, t: 20, b: 40 };
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
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id="shadeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={pad.l}
          x2={pad.l + W}
          y1={sy(maxY * f)}
          y2={sy(maxY * f)}
          stroke="#e2e8f0"
          strokeWidth="0.5"
          strokeDasharray="4,4"
          opacity="0.3"
        />
      ))}

      {/* Shaded area */}
      {shadePath && <path d={shadePath} fill="url(#shadeGrad)" />}

      {/* Curve */}
      <path
        d={pathAll}
        fill="none"
        stroke="url(#curveGrad)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Axis */}
      <line
        x1={pad.l}
        x2={pad.l + W}
        y1={sy(0)}
        y2={sy(0)}
        stroke="#cbd5e1"
        strokeWidth="1.5"
      />

      {/* μ marker */}
      <circle cx={sx(mu)} cy={sy(0)} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
      <text
        x={sx(mu)}
        y={sy(0) + 22}
        textAnchor="middle"
        fontSize="11"
        fill="#1e293b"
        fontWeight="500"
      >
        μ = {mu.toFixed(1)}
      </text>

      {/* a, b markers */}
      {a > lo && a < hi && (
        <>
          <line
            x1={sx(a)}
            x2={sx(a)}
            y1={sy(0)}
            y2={sy(normalPDF(a, mu, sigma))}
            stroke="#f97316"
            strokeWidth="2"
            strokeDasharray="6,4"
          />
          <circle cx={sx(a)} cy={sy(normalPDF(a, mu, sigma))} r="4" fill="#f97316" stroke="white" strokeWidth="2" />
          <text
            x={sx(a)}
            y={sy(normalPDF(a, mu, sigma)) - 12}
            textAnchor="middle"
            fontSize="11"
            fill="#f97316"
            fontWeight="600"
          >
            a = {a}
          </text>
        </>
      )}
      {b > lo && b < hi && (
        <>
          <line
            x1={sx(b)}
            x2={sx(b)}
            y1={sy(0)}
            y2={sy(normalPDF(b, mu, sigma))}
            stroke="#f97316"
            strokeWidth="2"
            strokeDasharray="6,4"
          />
          <circle cx={sx(b)} cy={sy(normalPDF(b, mu, sigma))} r="4" fill="#f97316" stroke="white" strokeWidth="2" />
          <text
            x={sx(b)}
            y={sy(normalPDF(b, mu, sigma)) - 12}
            textAnchor="middle"
            fontSize="11"
            fill="#f97316"
            fontWeight="600"
          >
            b = {b}
          </text>
        </>
      )}
    </svg>
  );
}

// ─── Step Card ─────────────────────────────────────────────────────────────────
function StepCard({ number, title, children, icon }) {
  return (
    <div className="step-card">
      <div className="step-header">
        <span className="step-number">{number}</span>
        <span className="step-title">{title}</span>
      </div>
      <div className="step-content">
        {children}
      </div>
    </div>
  );
}

// ─── Input Group ───────────────────────────────────────────────────────────────
function InputGroup({ label, value, onChange, min, max, step = 1, unit = "" }) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <div className="input-wrapper">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {unit && <span className="input-unit">{unit}</span>}
      </div>
    </div>
  );
}

// ─── Result Badge ──────────────────────────────────────────────────────────────
function ResultBadge({ label, value, color = "primary" }) {
  return (
    <div className={`result-badge ${color}`}>
      <span className="result-label">{label}</span>
      <span className="result-value">{value}</span>
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
  const fmtPercent = (n) => (n * 100).toFixed(2);

  return (
    <>
      <p className="part-description">
        Calculez la probabilité qu'une variable aléatoire <strong>X ~ N(μ, σ²)</strong>
        se trouve dans un intervalle <strong>[a, b]</strong>.
      </p>

      <div className="part-container">
        <div className="inputs-grid">
          <InputGroup label="Moyenne (μ)" value={mu} onChange={setMu} min={-100} max={100} />
          <InputGroup label="Variance (σ²)" value={variance} onChange={setVariance} min={0.1} max={100} step={0.1} />
          <InputGroup label="Borne inférieure (a)" value={a} onChange={setA} min={-100} max={100} />
          <InputGroup label="Borne supérieure (b)" value={b} onChange={setB} min={-100} max={100} />
        </div>

        <div className="curve-container">
          <BellCurve mu={mu} sigma={sigma} a={a} b={b} />
        </div>

        {result && (
          <div className="steps-container">
            <StepCard number="1" title="Standardisation">
              <div className="step-formula">
                <span>Z = (X − μ) / σ = (X − {mu}) / {fmt(sigma)}</span>
                <div className="formula-row">
                  <span>z₁ = ({a} − {mu}) / {fmt(sigma)} =</span>
                  <strong className="text-accent">{fmtZ(result.za)}</strong>
                </div>
                <div className="formula-row">
                  <span>z₂ = ({b} − {mu}) / {fmt(sigma)} =</span>
                  <strong className="text-accent">{fmtZ(result.zb)}</strong>
                </div>
              </div>
            </StepCard>

            <StepCard number="2" title="Table de la loi normale">
              <div className="step-formula">
                <div className="formula-row">
                  <span>Φ({fmtZ(result.zb)}) =</span>
                  <strong className="text-primary">{fmt(result.phiB)}</strong>
                </div>
                <div className="formula-row">
                  <span>Φ({fmtZ(result.za)}) =</span>
                  <strong className="text-primary">{fmt(result.phiA)}</strong>
                </div>
              </div>
            </StepCard>

            <StepCard number="3" title="Résultat">
              <div className="step-formula">
                <div className="formula-row">
                  <span>P[{a} &lt; X &lt; {b}] = Φ({fmtZ(result.zb)}) − Φ({fmtZ(result.za)})</span>
                </div>
                <div className="formula-row">
                  <span>= {fmt(result.phiB)} − {fmt(result.phiA)}</span>
                </div>
                <div className="result-row">
                  <span className="result-value-large">{fmt(result.prob)}</span>
                  <span className="result-percent">({fmtPercent(result.prob)}%)</span>
                </div>
              </div>
            </StepCard>
          </div>
        )}
      </div>
    </>
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
    const sigma = (x2 - x1) / (z2 - z1);
    const mu = x1 - z1 * sigma;
    setResult({ z1, z2, mu, sigma, sigma2: sigma * sigma });
  };

  useEffect(() => { calculate(); }, [x1, p1, x2, p2]);

  const fmt = (n) => n.toFixed(4);
  const fmtZ = (n) => (n >= 0 ? "+" : "") + n.toFixed(4);

  if (!result || isNaN(result.mu) || !isFinite(result.mu) || result.sigma <= 0) {
    return (
      <div className="part-container">
        <p className="part-description">
          Déterminez les paramètres <strong>μ</strong> et <strong>σ</strong> d'une loi normale
          à partir de deux probabilités cumulées connues.
        </p>
        <div className="inputs-grid">
          <InputGroup label="x₁" value={x1} onChange={setX1} />
          <InputGroup label="P[Y < x₁]" value={p1} onChange={setP1} min={0.0001} max={0.9999} step={0.0001} />
          <InputGroup label="x₂" value={x2} onChange={setX2} />
          <InputGroup label="P[Y < x₂]" value={p2} onChange={setP2} min={0.0001} max={0.9999} step={0.0001} />
        </div>
        <div className="error-message">
          Les valeurs saisies ne permettent pas de déterminer une loi normale valide.
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="part-description">
        Déterminez les paramètres <strong>μ</strong> et <strong>σ</strong> d'une loi normale
        à partir de deux probabilités cumulées connues.
      </p>

      <div className="part-container">
        <div className="inputs-grid">
          <InputGroup label="x₁" value={x1} onChange={setX1} />
          <InputGroup label="P[Y < x₁]" value={p1} onChange={setP1} min={0.0001} max={0.9999} step={0.0001} />
          <InputGroup label="x₂" value={x2} onChange={setX2} />
          <InputGroup label="P[Y < x₂]" value={p2} onChange={setP2} min={0.0001} max={0.9999} step={0.0001} />
        </div>

        <div className="curve-container">
          <BellCurve mu={result.mu} sigma={result.sigma} a={x1} b={x2} />
        </div>

        <div className="steps-container">
          <StepCard number="1" title="Trouver z₁ et z₂">
            <div className="step-formula">
              <div className="formula-row">
                <span>Φ(z₁) = {p1} → z₁ = Φ⁻¹({p1}) =</span>
                <strong className="text-accent">{fmtZ(result.z1)}</strong>
              </div>
              <div className="formula-row">
                <span>Φ(z₂) = {p2} → z₂ = Φ⁻¹({p2}) =</span>
                <strong className="text-accent">{fmtZ(result.z2)}</strong>
              </div>
            </div>
          </StepCard>

          <StepCard number="2" title="Système d'équations">
            <div className="step-formula">
              <div className="formula-row">
                <span>({x1} − μ) / σ = {fmtZ(result.z1)}</span>
              </div>
              <div className="formula-row">
                <span>({x2} − μ) / σ = {fmtZ(result.z2)}</span>
              </div>
            </div>
          </StepCard>

          <StepCard number="3" title="Résolution">
            <div className="step-formula">
              <div className="formula-row">
                <span>σ = ({x2} − {x1}) / ({fmtZ(result.z2)} − {fmtZ(result.z1)}) =</span>
                <strong className="text-primary">{fmt(result.sigma)}</strong>
              </div>
              <div className="formula-row">
                <span>μ = {x1} − ({fmtZ(result.z1)}) × {fmt(result.sigma)} =</span>
                <strong className="text-primary">{fmt(result.mu)}</strong>
              </div>
            </div>
          </StepCard>
        </div>

        <div className="results-grid">
          <ResultBadge label="Moyenne (μ)" value={fmt(result.mu)} color="success" />
          <ResultBadge label="Écart-type (σ)" value={fmt(result.sigma)} color="success" />
          <ResultBadge label="Variance (σ²)" value={fmt(result.sigma2)} color="success" />
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [tab, setTab] = useState("a");

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f8fafc;
        }

        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
        }

        /* Sidebar navigation */
        .sidebar {
          width: 230px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(255, 255, 255, 0.2);
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          margin-bottom: 2rem;
          padding: 0 1rem;
        }

        .sidebar-header h1 {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.25rem;
          letter-spacing: -0.02em;
        }

        .sidebar-header p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .nav-tabs {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: none;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          text-align: left;
          width: 100%;
        }

        .nav-tab:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .nav-tab.active {
          background: white;
          color: #667eea;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .nav-tab span:last-child {
          flex: 1;
        }

        /* Main content */
        .main-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .part-container {
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .part-description {
          color: #fff;
          font-size: 1.2rem;
          padding-bottom: 1rem;
        }

        .part-description strong {
          color: #667eea;
          font-weight: 600;
        }

        .inputs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 500;
          font-family: inherit;
          transition: all 0.2s;
          background: white;
          color: #1e293b;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-unit {
          position: absolute;
          right: 1rem;
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
          pointer-events: none;
        }

        .curve-container {
          background: #f8fafc;
          border-radius: 1rem;
          padding: 1.5rem;
          border: 2px solid #e2e8f0;
        }

        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .step-card {
          background: #f8fafc;
          border-radius: 1rem;
          padding: 1.25rem;
          border: 2px solid #e2e8f0;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .step-number {
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 700;
          font-size: 0.875rem;
          border-radius: 0.5rem;
        }

        .step-title {
          font-weight: 600;
          color: #1e293b;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }

        .step-content {
          color: #475569;
          font-size: 0.9375rem;
        }

        .step-formula {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .formula-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px dashed #e2e8f0;
        }

        .formula-row:last-child {
          border-bottom: none;
        }

        .text-primary {
          color: #667eea;
          font-weight: 600;
        }

        .text-accent {
          color: #f97316;
          font-weight: 600;
        }

        .result-row {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 2px solid #e2e8f0;
        }

        .result-value-large {
          font-size: 1.5rem;
          font-weight: 800;
          color: #10b981;
        }

        .result-percent {
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }

        .result-badge {
          background: #f8fafc;
          border-radius: 1rem;
          padding: 1rem;
          text-align: center;
          border: 2px solid #e2e8f0;
        }

        .result-badge.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: transparent;
        }

        .result-badge.success .result-label,
        .result-badge.success .result-value {
          color: white;
        }

        .result-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          margin-bottom: 0.25rem;
        }

        .result-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .error-message {
          background: #fee2e2;
          color: #ef4444;
          padding: 1rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          text-align: center;
          border: 2px solid #fecaca;
        }

        @media (max-width: 768px) {
          .app {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding: 1rem;
          }
          
          .sidebar-header {
            margin-bottom: 1rem;
          }
          
          .nav-tabs {
            flex-direction: row;
          }
          
          .nav-tab {
            padding: 0.75rem;
            justify-content: center;
          }
          
          .nav-tab span:last-child {
            display: none;
          }
          
          .main-content {
            padding: 1rem;
          }

          .inputs-grid {
            grid-template-columns: 1fr;
          }
          
          .results-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>Loi Normale</h1>
          <p>Calculateur</p>
        </div>

        <div className="nav-tabs">
          <button
            className={`nav-tab ${tab === "a" ? "active" : ""}`}
            onClick={() => setTab("a")}
          >
            <span>P[a &lt; X &lt; b]</span>
          </button>
          <button
            className={`nav-tab ${tab === "b" ? "active" : ""}`}
            onClick={() => setTab("b")}
          >
            <span>Trouver μ & σ</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-card">
          {tab === "a" ? <PartA /> : <PartB />}
        </div>
      </div>
    </div>
  );
}