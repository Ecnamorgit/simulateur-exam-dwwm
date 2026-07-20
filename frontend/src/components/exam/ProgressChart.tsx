import React from 'react';

interface Point {
  date?: string;
  score: number;
}

interface Props {
  points: Point[];
}

/** Petit graphique en barres (SVG) de la progression des scores d'examens blancs. */
const ProgressChart: React.FC<Props> = ({ points }) => {
  if (points.length === 0) return null;

  const W = 520;
  const H = 160;
  const pad = 28;
  const n = points.length;
  const barGap = 10;
  const barW = Math.max(8, (W - pad * 2 - barGap * (n - 1)) / n);

  const color = (s: number) => (s >= 70 ? 'var(--color-fern, #4a7c59)' : s >= 50 ? '#d6b22e' : '#d32f2f');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Progression des scores d'examens blancs">
      {/* Lignes de repère 0 / 50 / 100 */}
      {[0, 50, 100].map((v) => {
        const y = H - pad - (v / 100) * (H - pad * 2);
        return (
          <g key={v}>
            <line x1={pad} y1={y} x2={W - pad} y2={y} stroke="rgba(0,0,0,0.08)" />
            <text x={4} y={y + 4} fontSize="10" fill="rgba(0,0,0,0.5)">{v}</text>
          </g>
        );
      })}
      {points.map((p, i) => {
        const h = (p.score / 100) * (H - pad * 2);
        const x = pad + i * (barW + barGap);
        const y = H - pad - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={4} fill={color(p.score)} />
            <text x={x + barW / 2} y={y - 4} fontSize="10" textAnchor="middle" fill="var(--color-charcoal, #333)">{p.score}</text>
          </g>
        );
      })}
    </svg>
  );
};

export default ProgressChart;
