import Link from "next/link";

const GRADIENTS = [
  {
    name: "안정형 블루",
    className: "bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-700",
    label: "from-sky-700 via-blue-700 to-indigo-700",
  },
  {
    name: "밝은 블루",
    className: "bg-gradient-to-r from-cyan-700 via-blue-700 to-slate-700",
    label: "from-cyan-700 via-blue-700 to-slate-700",
  },
  {
    name: "은은한 블루",
    className: "bg-gradient-to-r from-sky-700 via-teal-600 to-blue-700",
    label: "from-sky-700 via-teal-600 to-blue-700",
  },
];

export default function GradientSamplesPage() {
  return (
    <main className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[26px] border border-slate-200 bg-white/95 p-6 sm:p-8">
          <p className="text-xs tracking-[0.22em] text-slate-500 font-bold">MATHLAB EXPERIENCE</p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            타이틀 그라데이션 샘플
          </h1>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            아래 3개 샘플을 실제 화면에서 비교해봐. 맘에 드는 톤으로 바로 메인 타이틀에 적용할 수 있어.
          </p>
          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-black rounded-full border border-slate-300 px-4 py-2 text-slate-800 bg-white hover:bg-slate-50"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </section>

        <section className="mt-7 grid gap-5 md:grid-cols-3">
          {GRADIENTS.map((g) => (
            <article
              key={g.name}
              className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-sm font-bold text-slate-500 mb-4">{g.name}</h2>
              <h3
                className={`text-2xl sm:text-3xl font-black tracking-tight bg-clip-text text-transparent ${g.className}`}
              >
                매일 똑똑해지는 계산 연습, 매스레빗으로 시작
              </h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                코드: <span className="font-mono">{g.label}</span>
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
