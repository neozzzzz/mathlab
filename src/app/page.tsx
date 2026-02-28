import { ArrowRight, PencilLine, Layers, Link2, Sparkles, UsersRound } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import { GA_EVENTS } from "@/lib/ga";

const MODES = [
  {
    href: "/match",
    title: "짝 맞추기",
    desc: "윗줄 숫자와 결과를 이어 쓰는 시퀀스 훈련",
    badge: "더하기 · 빼기",
    icon: Link2,
    accent: "from-fuchsia-500/15 to-rose-100/40",
  },
  {
    href: "/calc",
    title: "일반 연산",
    desc: "빈칸 채우기형 계산 연습으로 정확도와 속도 업",
    badge: "더하기 · 빼기 · 곱하기 · 나누기",
    icon: PencilLine,
    accent: "from-sky-500/15 to-sky-100/35",
  },
  {
    href: "/calc3",
    title: "3개 수 연산",
    desc: "세 자리 사고를 키우는 단계별 수열형 문제",
    badge: "a ○ b ○ c",
    icon: Layers,
    accent: "from-emerald-500/15 to-emerald-100/35",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-100/70 py-6 sm:py-8 px-4">
      <div className="mx-auto max-w-6xl relative">
        <div className="pointer-events-none absolute -top-14 right-2 sm:right-20 h-40 w-40 rounded-full blur-3xl bg-fuchsia-200/50" />
        <div className="pointer-events-none absolute bottom-10 left-2 sm:left-32 h-32 w-32 rounded-full blur-3xl bg-sky-200/40" />

        <header className="relative z-10 rounded-[26px] border border-slate-200 bg-white/90 backdrop-blur p-6 sm:p-8">
          <p className="text-xs tracking-[0.22em] text-slate-500 font-bold">MATHLAB EXPERIENCE</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
            수학 문제 생성기
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 text-sm sm:text-base leading-relaxed">
            설정은 한 번에 끝내고, 즉시 미리보기와 인쇄/공유로 이어지는 학습지 제작 플로우로 바꿔보세요.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-xs font-bold text-slate-700">
              <Sparkles className="w-4 h-4" />
              v1.1 인터페이스 리디자인
            </div>
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 text-white px-4 py-2 text-xs font-bold hover:bg-slate-800">
              생성 후 바로 인쇄
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        <section className="relative z-10 mt-7 grid gap-5 md:grid-cols-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <TrackedLink
                key={m.href}
                href={m.href}
                gaEvent={GA_EVENTS.SELECT_MENU}
                gaParams={{ menu: m.href.slice(1) }}
                className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_44px_rgba(15,23,42,0.10)]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${m.accent} opacity-80`} />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white px-3 py-1 text-[11px] font-black text-slate-600">
                    {m.badge}
                  </div>
                  <div className="mt-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm">
                    <Icon className="w-6 h-6 text-slate-800" strokeWidth={2.2} />
                  </div>
                  <h2 className="mt-4 text-2xl font-black text-slate-900">{m.title}</h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{m.desc}</p>
                  <p className="mt-5 inline-flex items-center text-sm font-bold text-slate-800 group-hover:gap-2 transition-all duration-200">
                    시작하기 <ArrowRight className="w-4 h-4 ml-1" />
                  </p>
                </div>
              </TrackedLink>
            );
          })}
        </section>

        <div className="relative z-10 mt-7 rounded-[22px] border border-dashed border-slate-300 bg-white/70 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            <span className="font-black text-slate-800">J용 학습지</span>를 빠르게 만들고 공유 링크로 수업 전에 바로 배포하세요.
          </p>
          <TrackedLink
            href="/match"
            gaEvent={GA_EVENTS.SELECT_MENU}
            gaParams={{ menu: "quick"
            }}
            className="inline-flex items-center gap-2 text-sm font-black text-slate-800"
          >
            빠른 시작 <UsersRound className="w-4 h-4" />
          </TrackedLink>
        </div>
      </div>
    </div>
  );
}
