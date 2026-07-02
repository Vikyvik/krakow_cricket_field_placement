"use client";

import { useState, useRef, useCallback } from "react";

const VW = 950, VH = 660;
const ARC_CX = 475, ARC_CY = 300, ARC_R = 230;
const CORRIDOR_Y = 490;
const CORRIDOR_L = 345, CORRIDOR_R = 605;
const WHITE_Y = 605;
const BAT_X = 475, BAT_Y = 505;

const isInside30 = (x, y) => {
  if (y <= CORRIDOR_Y) return Math.hypot(x - ARC_CX, y - ARC_CY) <= ARC_R;
  if (y <= WHITE_Y) return x >= CORRIDOR_L && x <= CORRIDOR_R;
  return false;
};

const arcPath = `M ${CORRIDOR_L} ${CORRIDOR_Y} A ${ARC_R} ${ARC_R} 0 1 1 ${CORRIDOR_R} ${CORRIDOR_Y}`;
const insideZonePath = `${arcPath} L ${CORRIDOR_R} ${WHITE_Y} L ${CORRIDOR_L} ${WHITE_Y} Z`;

const PRESETS = {
  powerplay: {
    label: "Powerplay 1–6",
    maxOut: 2,
    note: "Slip in — synthetic ball carries. One out at deep square for the pull.",
    fielders: [
      { role: "Keeper", x: 475, y: 545 }, { role: "Bowler", x: 475, y: 140 },
      { role: "Slip", x: 512, y: 548 }, { role: "Point", x: 625, y: 430 },
      { role: "Cover", x: 615, y: 320 }, { role: "Mid-off", x: 550, y: 190 },
      { role: "Mid-on", x: 400, y: 190 }, { role: "Midwicket", x: 345, y: 322 },
      { role: "Short third", x: 585, y: 555 }, { role: "Short fine", x: 365, y: 555 },
      { role: "Deep square", x: 165, y: 455 },
    ],
  },
  middle: {
    label: "Middle 7–15",
    maxOut: 4,
    note: "Three out. Corner guards tucked just inside the drop lines.",
    fielders: [
      { role: "Keeper", x: 475, y: 545 }, { role: "Bowler", x: 475, y: 140 },
      { role: "Point", x: 620, y: 430 }, { role: "Cover", x: 610, y: 315 },
      { role: "Mid-off", x: 550, y: 190 }, { role: "Mid-on", x: 405, y: 190 },
      { role: "Short third", x: 585, y: 555 }, { role: "Short fine", x: 365, y: 555 },
      { role: "Deep point", x: 790, y: 450 }, { role: "Deep midwicket", x: 185, y: 280 },
      { role: "Long-on", x: 390, y: 45 },
    ],
  },
  deathWide: {
    label: "Death · wide line",
    maxOut: 4,
    note: "Bowl wide yorkers / slower balls outside off. Deep square stays open — don't stray onto the pads.",
    fielders: [
      { role: "Keeper", x: 475, y: 550 }, { role: "Bowler", x: 475, y: 140 },
      { role: "Point", x: 630, y: 435 }, { role: "Cover", x: 615, y: 315 },
      { role: "Mid-on", x: 405, y: 195 }, { role: "Short third", x: 585, y: 555 },
      { role: "Short fine", x: 365, y: 555 }, { role: "Long-off", x: 565, y: 45 },
      { role: "Long-on", x: 385, y: 45 }, { role: "Deep cover-point", x: 780, y: 350 },
      { role: "Deep midwicket", x: 180, y: 300 },
    ],
  },
  deathBody: {
    label: "Death · into body",
    maxOut: 4,
    note: "Hard length and cutters into the pitch. Long-off open — nothing full and wide.",
    fielders: [
      { role: "Keeper", x: 475, y: 550 }, { role: "Bowler", x: 475, y: 140 },
      { role: "Point", x: 630, y: 430 }, { role: "Mid-off", x: 550, y: 195 },
      { role: "Midwicket", x: 345, y: 322 }, { role: "Short third", x: 585, y: 555 },
      { role: "Short fine", x: 365, y: 555 }, { role: "Deep square", x: 160, y: 460 },
      { role: "Deep midwicket", x: 185, y: 290 }, { role: "Long-on", x: 385, y: 45 },
      { role: "Deep cover", x: 770, y: 300 },
    ],
  },
};

const PHASE_ORDER = ["powerplay", "middle", "deathWide", "deathBody"];

export default function FieldPlanner() {
  const [phase, setPhase] = useState("middle");
  const [fielders, setFielders] = useState(
    PRESETS.middle.fielders.map((f, i) => ({ ...f, id: i, name: "" }))
  );
  const [selected, setSelected] = useState(null);
  const [dragId, setDragId] = useState(null);
  const svgRef = useRef(null);

  const applyPreset = (key) => {
    setPhase(key);
    setFielders((prev) =>
      PRESETS[key].fielders.map((f, i) => ({ ...f, id: i, name: prev[i]?.name || "" }))
    );
    setSelected(null);
  };

  const mirror = () => {
    setFielders((prev) => prev.map((f) => ({ ...f, x: VW - f.x })));
  };

  const toSvgCoords = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * VW,
      y: ((e.clientY - rect.top) / rect.height) * VH,
    };
  }, []);

  const onPointerDown = (e, id) => {
    e.preventDefault();
    setDragId(id);
    setSelected(id);
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (dragId === null) return;
    const { x, y } = toSvgCoords(e);
    const cx = Math.min(Math.max(x, 24), VW - 24);
    const cy = Math.min(Math.max(y, 24), WHITE_Y - 4);
    setFielders((prev) => prev.map((f) => (f.id === dragId ? { ...f, x: cx, y: cy } : f)));
  };
  const endDrag = () => setDragId(null);

  const outFielders = fielders.filter((f) => !isInside30(f.x, f.y));
  const maxOut = PRESETS[phase].maxOut;
  const legal = outFielders.length <= maxOut;
  const sel = selected !== null ? fielders.find((f) => f.id === selected) : null;

  return (
    <div style={{
      minHeight: "100vh", background: "#101511", color: "#e8ede6",
      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "16px 10px 28px",
    }}>
      <div style={{ width: "100%", maxWidth: 960, display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#7fae6f", fontWeight: 700 }}>
            CCC 11 &middot; Kraków Cricket League
          </div>
          <h1 style={{ margin: "2px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: "-0.01em" }}>
            Field Planner
          </h1>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: legal ? "#16241a" : "#2b1416",
          border: `1px solid ${legal ? "#2f5d3a" : "#8a2f36"}`,
          borderRadius: 10, padding: "8px 14px",
        }}>
          <span style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: legal ? "#7dd88f" : "#ff7b84", lineHeight: 1 }}>
            {outFielders.length}
          </span>
          <span style={{ fontSize: 11, lineHeight: 1.35, color: "#aab5a8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            outside 30yd<br />max {maxOut} {legal ? "✓ legal" : "✗ illegal"}
          </span>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 960, display: "flex", gap: 8, margin: "14px 0 10px", flexWrap: "wrap" }}>
        {PHASE_ORDER.map((key) => (
          <button key={key} onClick={() => applyPreset(key)} style={{
            padding: "8px 14px", borderRadius: 999, cursor: "pointer",
            fontSize: 13, fontWeight: 700, letterSpacing: "0.02em",
            border: phase === key ? "1px solid #9fd18a" : "1px solid #2c3a2e",
            background: phase === key ? "#284a2c" : "#182019",
            color: phase === key ? "#dff5d4" : "#9fb09a",
          }}>
            {PRESETS[key].label}
          </button>
        ))}
        <button onClick={mirror} title="Mirror for left-hander" style={{
          padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 700,
          border: "1px solid #2c3a2e", background: "#182019", color: "#9fb09a", marginLeft: "auto",
        }}>
          ⇄ LH batter
        </button>
      </div>

      <div style={{ width: "100%", maxWidth: 960, fontSize: 13, color: "#a8b6a2", marginBottom: 10 }}>
        {PRESETS[phase].note} Presets are set for a right-hander — drag anyone, anywhere.
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: "100%", maxWidth: 960, borderRadius: 14, touchAction: "none", display: "block", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <defs>
          <linearGradient id="turf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4b7a1f" />
            <stop offset="0.5" stopColor="#5c8f26" />
            <stop offset="1" stopColor="#47741e" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={VW} height={VH} fill="url(#turf)" />
        {[...Array(8)].map((_, i) => (
          <rect key={i} x={i * (VW / 8)} y="0" width={VW / 16} height={VH} fill="#000" opacity="0.05" />
        ))}

        <g stroke="#e9f0dc" strokeWidth="2" fill="none" opacity="0.35">
          <rect x="18" y="18" width={VW - 36} height={VH - 36} />
          <line x1={VW / 2} y1="18" x2={VW / 2} y2={VH - 18} />
          <circle cx={VW / 2} cy={VH / 2 - 30} r="85" />
          <rect x="18" y="170" width="120" height="280" />
          <rect x={VW - 138} y="170" width="120" height="280" />
        </g>

        <path d={insideZonePath} fill="#ffffff" opacity="0.07" />

        <path d={arcPath} stroke="#4040e8" strokeWidth="11" fill="none" strokeLinecap="round" />
        <line x1={CORRIDOR_L} y1={CORRIDOR_Y} x2={CORRIDOR_L} y2={WHITE_Y} stroke="#4040e8" strokeWidth="5" strokeDasharray="10 9" opacity="0.85" />
        <line x1={CORRIDOR_R} y1={CORRIDOR_Y} x2={CORRIDOR_R} y2={WHITE_Y} stroke="#4040e8" strokeWidth="5" strokeDasharray="10 9" opacity="0.85" />

        <rect x={BAT_X - 32} y={165} width="64" height="325" rx="8" fill="none" stroke="#2ee6a0" strokeWidth="11" />

        <line x1="185" y1={WHITE_Y} x2="705" y2={WHITE_Y} stroke="#ffffff" strokeWidth="12" strokeLinecap="round" />
        <text x={VW / 2} y={WHITE_Y + 34} textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="700" opacity="0.9">2 RUNS BEYOND</text>

        <path d="M 35 590 L 35 615 L 160 615 L 160 598" stroke="#f45fb0" strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M 915 590 L 915 615 L 790 615 L 790 598" stroke="#f45fb0" strokeWidth="11" fill="none" strokeLinecap="round" />
        <text x="97" y="580" textAnchor="middle" fill="#ffd7ec" fontSize="14" fontWeight="700">4 / 6</text>
        <text x="852" y="580" textAnchor="middle" fill="#ffd7ec" fontSize="14" fontWeight="700">4 / 6</text>

        <ellipse cx={BAT_X} cy={BAT_Y} rx="26" ry="16" fill="#e8271d" />
        <text x={BAT_X} y={BAT_Y + 5} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="800">BAT</text>

        {fielders.map((f) => {
          const inside = isInside30(f.x, f.y);
          const isSel = selected === f.id;
          return (
            <g key={f.id}
               onPointerDown={(e) => onPointerDown(e, f.id)}
               style={{ cursor: "grab" }}>
              {isSel && <circle cx={f.x} cy={f.y} r="26" fill="none" stroke="#ffe066" strokeWidth="3" />}
              <circle cx={f.x} cy={f.y} r="18"
                fill={inside ? "#f5f2e4" : "#ffb020"}
                stroke={inside ? "#3a4a35" : "#7a4a00"} strokeWidth="2.5" />
              <text x={f.x} y={f.y + 5} textAnchor="middle" fontSize="13" fontWeight="800"
                fill="#22301f" style={{ pointerEvents: "none" }}>
                {f.id + 1}
              </text>
              <text x={f.x} y={f.y + 36} textAnchor="middle" fontSize="13" fontWeight="700"
                fill="#ffffff" stroke="#1c2a17" strokeWidth="3" paintOrder="stroke"
                style={{ pointerEvents: "none" }}>
                {f.name || f.role}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{
        width: "100%", maxWidth: 960, marginTop: 12, display: "flex",
        alignItems: "center", gap: 12, flexWrap: "wrap",
        background: "#161d16", border: "1px solid #263126", borderRadius: 12, padding: "10px 14px",
      }}>
        {sel ? (
          <>
            <span style={{
              width: 30, height: 30, borderRadius: "50%", display: "inline-flex",
              alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14,
              background: isInside30(sel.x, sel.y) ? "#f5f2e4" : "#ffb020", color: "#22301f",
            }}>{sel.id + 1}</span>
            <div style={{ minWidth: 120 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{sel.role}</div>
              <div style={{ fontSize: 12, color: isInside30(sel.x, sel.y) ? "#7dd88f" : "#ffb020" }}>
                {isInside30(sel.x, sel.y) ? "inside 30yd" : "outside 30yd"}
              </div>
            </div>
            <input
              value={sel.name}
              placeholder="Player name (optional)"
              onChange={(e) =>
                setFielders((prev) => prev.map((f) => (f.id === sel.id ? { ...f, name: e.target.value } : f)))
              }
              style={{
                flex: 1, minWidth: 160, background: "#0e130e", border: "1px solid #2c3a2e",
                borderRadius: 8, padding: "8px 10px", color: "#e8ede6", fontSize: 14, outline: "none",
              }}
            />
          </>
        ) : (
          <span style={{ fontSize: 13, color: "#8a9a85" }}>
            Tap a fielder to select and add a player's name. Amber = outside the 30-yard zone.
          </span>
        )}
      </div>
    </div>
  );
              }
