/**
 * 문제지용 아날로그 시계. minuteOfDay 는 0시 기준 분(12시간제로 그린다).
 * - hideHands: 바늘 없이 그려 학생이 시곗바늘을 그려 넣게 한다.
 * - mirror: 거울에 비친 모습처럼 좌우를 뒤집는다(숫자도 뒤집힌다).
 * - shadeFromMinute: 그 시각부터 지금 시각까지 긴바늘이 지나간 부분을 칠한다.
 */
export function AnalogClock({
  minuteOfDay,
  size = 112,
  label,
  hideHands = false,
  mirror = false,
  shadeFromMinute,
}: {
  minuteOfDay: number;
  size?: number;
  label?: string;
  hideHands?: boolean;
  mirror?: boolean;
  shadeFromMinute?: number;
}) {
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

  // 지나간 분(60분 미만)만큼 시계 안쪽을 부채꼴로 칠한다.
  let shade: string | null = null;
  if (shadeFromMinute !== undefined) {
    const elapsed = minuteOfDay - shadeFromMinute;
    if (elapsed > 0 && elapsed < 60) {
      const from = point(((shadeFromMinute % 60) / 60) * 360, 43);
      shade = `M ${c} ${c} L ${from.x} ${from.y} A 43 43 0 ${elapsed > 30 ? 1 : 0} 1 ${point(minuteAngle, 43).x} ${point(minuteAngle, 43).y} Z`;
    }
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label}>
      <g transform={mirror ? "translate(100 0) scale(-1 1)" : undefined}>
      <circle cx={c} cy={c} r={47} fill="#fff" stroke="#3f3f46" strokeWidth={3.5} />
      {shade && <path d={shade} fill="#f9a8d4" fillOpacity={0.55} />}
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
      {!hideHands && (
        <>
          <line x1={c} y1={c} x2={hourEnd.x} y2={hourEnd.y} stroke="#18181b" strokeWidth={3.6} strokeLinecap="round" />
          <line x1={c} y1={c} x2={minuteEnd.x} y2={minuteEnd.y} stroke="#18181b" strokeWidth={2.2} strokeLinecap="round" />
        </>
      )}
      <circle cx={c} cy={c} r={2.6} fill="#18181b" />
      </g>
    </svg>
  );
}
