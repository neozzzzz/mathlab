import Link from "next/link";

const menus = [
  { href: "/match", label: "짝맞추기", desc: "기본 타입(더하기/뺄기)" },
  { href: "/calc", label: "사칙연산", desc: "연산 타입/범위 통합" },
  { href: "/calc3", label: "3자리 연산", desc: "3개 수로 구성된 난도 높은 연산" },
  { href: "/preview", label: "미리보기", desc: "공유 전에 결과 검토" },
];

export default function V2Entry() {
  return (
    <div className="min-h-[100dvh] bg-slate-100/70 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-black text-slate-900 mb-2">MathLAB v2 설계 데모</h1>
        <p className="text-sm text-slate-600 mb-6">
          현재는 v2 API 아키텍처와 핵심 타입/스키마를 먼저 정비한 상태입니다.
          아래 메뉴에서 기존 생성 플로우를 검증할 수 있고,
          <span className="font-bold"> /api/v2/worksheets </span>
          로 신규 생성 API를 제공합니다.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {menus.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400 hover:shadow-sm transition"
            >
              <div className="text-sm text-slate-500">{m.href}</div>
              <div className="text-lg font-bold text-slate-900">{m.label}</div>
              <div className="text-sm text-slate-600 mt-1">{m.desc}</div>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-bold mb-1">v2 API 테스트</p>
          <p className="mb-2">POST /api/v2/worksheets</p>
          <pre className="overflow-auto text-xs bg-white/70 rounded-lg p-3 border border-emerald-200">
{`{
  "kind": "calc",
  "options": {
    "type": "add_sub",
    "count": 8,
    "sheets": 1,
    "rangeMin": 10,
    "rangeMax": 30,
    "opMin": 10,
    "opMax": 99,
    "layout": "a"
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
