/** 문제지용 아날로그 시계. minuteOfDay 는 0시 기준 분(12시간제로 그린다). */
export function AnalogClock({ minuteOfDay, size = 112, label }: { minuteOfDay: number; size?: number; label?: string }) {
  const minutes = ((minuteOfDay % 720) + 720) % 720;
  const hourAngle = (minutes / 720) * 360;
  const minuteAngle = ((minutes % 60) / 60) * 360;
  const c = 50;

  const point = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: c + radius * Math.cos(rad), y: c + radius * Math.sin(rad) };
  };

  const hourEnd = point(hourAngle, 24);
  const minuteEnd = point(minuteAngle, 34);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label}>
      <circle cx={c} cy={c} r={47} fill="#fff" stroke="#3f3f46" strokeWidth={3.5} />
      {Array.from({ length: 60 }, (_, i) => {
        const outer = point(i * 6, 43);
        const inner = point(i * 6, i % 5 === 0 ? 39.5 : 41.5);
        return (
          <line
            key={i}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="#52525b"
            strokeWidth={i % 5 === 0 ? 1.2 : 0.6}
          />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const p = point(n * 30, 32);
        return (
          <text key={n} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600} fill="#27272a">
            {n}
          </text>
        );
      })}
      <line x1={c} y1={c} x2={hourEnd.x} y2={hourEnd.y} stroke="#18181b" strokeWidth={3.6} strokeLinecap="round" />
      <line x1={c} y1={c} x2={minuteEnd.x} y2={minuteEnd.y} stroke="#18181b" strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={c} cy={c} r={2.6} fill="#18181b" />
    </svg>
  );
}
