import Link from "next/link";
import { ArrowRight, Printer, PencilLine, Layers, Link2, WandSparkles, Check } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import { GA_EVENTS } from "@/lib/ga";

const DEMO_STEPS = [
  {
    title: "1) 유형 선택",
    desc: "짝맞추기, 일반연산, 3개수 연산 중 원하는 템플릿을 바로 확인하세요.",
    action: "바로 가기",
    href: "/match",
    icon: Link2,
    event: "match",
    badge: "더하기 · 빼기",
    accent: "from-fuchsia-100/80 via-white to-rose-100/30",
  },
  {
    title: "2) 빠른 세팅",
    desc: "문항 수, 난이도, 표시 형식은 기본값을 조정해서 즉시 재생성할 수 있어요.",
    action: "설정 미리보기",
    href: "/calc",
    icon: PencilLine,
    event: "calc",
    badge: "더하기 · 빼기 · 곱하기 · 나누기",
    accent: "from-sky-100/80 via-white to-sky-100/30",
  },
  {
    title: "3) 연산형 확장",
    desc: "3단계 곱셈·나눗셈 형태까지 한 번에 테스트해보세요.",
    action: "3수 연산 보기",
    href: "/calc3",
    icon: Layers,
    event: "calc3",
    badge: "a ○ b ○ c = ?",
    accent: "from-emerald-100/70 via-white to-emerald-100/25",
  },
];

const FEATURES = [
  {
    title: "맞춤형 문제 생성",
    desc: "수학 레벨과 연산 조합에 맞춰 바로 문제를 생성합니다.",
  },
  {
    title: "미리보기 + 인쇄",
    desc: "워크시트 형태로 미리 확인 후 바로 인쇄로 이동합니다.",
  },
  {
    title: "공유 링크",
    desc: "학습지를 저장해 수업 전에 바로 링크로 공유할 수 있습니다.",
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[26px] border border-slate-200 bg-white/95 p-6 sm:p-8 shadow-sm">
          <p className="text-xs tracking-[0.22em] text-slate-500 font-bold">MATHLUV DEMO</p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-slate-900">매스레빗 데모</h1>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl">
            매일 똑똑해지는 계산 연습, 매스레빗으로 시작.
            지금 바로 핵심 흐름을 한 번에 체험해보세요.
          </p>
          <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl">
            한 번의 설정으로 무제한 워크시트 생성이 어떻게 동작하는지 확인할 수 있습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <TrackedLink
              href="/"
              gaEvent={GA_EVENTS.SELECT_MENU}
              gaParams={{ menu: "home_from_demo" }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 text-white px-4 py-2 text-xs font-bold hover:bg-slate-800"
            >
              메인으로
              <ArrowRight className="w-4 h-4" />
            </TrackedLink>
            <Link
              href="/preview"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              데모 인쇄 화면 보기
              <Printer className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="mt-7 grid gap-5 md:grid-cols-3">
          {DEMO_STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <TrackedLink
                key={s.href}
                href={s.href}
                gaEvent={GA_EVENTS.SELECT_MENU}
                gaParams={{ menu: `demo_${s.event}` }}
                className="group relative overflow-hidden rounded-[20px] border border-slate-200 bg-white p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${s.accent} opacity-70`} />
                <div className="relative flex flex-col gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm border border-slate-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">{s.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full border border-slate-300 bg-slate-100 text-slate-700 text-xs font-bold w-fit">
                    <Check className="w-3.5 h-3.5 mr-1" />
                    {s.badge}
                  </div>
                  <p className="mt-1 inline-flex items-center text-sm font-black text-slate-800 transition-transform duration-200 group-hover:translate-x-1">
                    {s.action}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </p>
                </div>
              </TrackedLink>
            );
          })}
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white border border-slate-200 p-5">
              <div className="inline-flex items-center justify-center rounded-full bg-slate-100 p-2 text-slate-700">
                <WandSparkles className="w-4 h-4" />
              </div>
              <h3 className="mt-3 text-sm font-black text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        <p className="mt-8 text-xs text-slate-500 text-center">데모는 바로 학습지 생성 흐름을 보여주기 위한 진입용 페이지입니다.</p>
      </div>
    </main>
  );
}
