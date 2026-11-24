// Simple paired bar chart: data = [{ label, in, out }]
// Values are printed above the bars so meaning never depends on colour alone.
const BarChart = ({ data, labelEvery = 1, title }) => {
  const max = Math.max(5, ...data.map((d) => Math.max(d.in, d.out)));
  const W = 640, H = 230, top = 22, base = 190;
  const slot = W / data.length;
  const bw = Math.min(22, slot / 2 - 3);
  const y = (v) => base - (v / max) * (base - top);
  const empty = data.every((d) => d.in === 0 && d.out === 0);
  const showValues = data.length <= 10;

  return (
    <div className="chart-box">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1="28" x2={W} y1={y(max * f)} y2={y(max * f)} className="grid-line" />
            <text x="0" y={y(max * f) + 4} className="axis-text">{Math.round(max * f)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = i * slot + slot / 2 + 8;
          return (
            <g key={i}>
              <title>{`${d.label}: ${d.in} in, ${d.out} out`}</title>
              <rect x={cx - bw - 1} y={y(d.in)} width={bw} height={base - y(d.in)} className="bar-in" />
              <rect x={cx + 1} y={y(d.out)} width={bw} height={base - y(d.out)} className="bar-out" />
              {showValues && d.in > 0 ? <text x={cx - bw / 2 - 1} y={y(d.in) - 4} textAnchor="middle" className="val-text">{d.in}</text> : null}
              {showValues && d.out > 0 ? <text x={cx + bw / 2 + 1} y={y(d.out) - 4} textAnchor="middle" className="val-text">{d.out}</text> : null}
              {i % labelEvery === 0 ? (
                <text x={cx} y={base + 20} textAnchor="middle" className="axis-text">{d.label}</text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {empty ? <p className="chart-empty muted">No stock movements in this period.</p> : null}
    </div>
  );
};

export default BarChart;
