import { ArrowRight, PencilLine, Layers, Link2, UsersRound } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import { GA_EVENTS } from "@/lib/ga";

const MODES = [
  {
    href: "/match",
    title: "짝 맞추기",
    desc: "윗줄 숫자와 아랫줄 결과를\n선으로 이어 보세요",
    badge: "더하기 · 빼기",
    icon: Link2,
    accent: "from-fuchsia-500/15 to-rose-100/40",
    hover: "hover:border-fuchsia-300",
  },
  {
    href: "/calc",
    title: "일반 연산",
    desc: "빈칸에 답을 직접\n써 넣는 연습 문제",
    badge: "더하기 · 빼기 · 곱하기 · 나누기",
    icon: PencilLine,
    accent: "from-sky-500/15 to-sky-100/35",
    hover: "hover:border-sky-300",
  },
  {
    href: "/calc3",
    title: "일반 연산 (3수)",
    desc: "세 개의 수로 구성된\n연산 연습 문제",
    badge: "a ○ b ○ c = ?",
    icon: Layers,
    accent: "from-emerald-500/15 to-emerald-100/35",
    hover: "hover:border-emerald-300",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-100/70 py-6 sm:py-8 px-4">
      <div className="mx-auto max-w-6xl relative">
        <header className="relative z-10 rounded-[26px] border border-slate-200 bg-white/90 backdrop-blur p-6 sm:p-8">
          <p className="text-xs tracking-[0.22em] text-slate-500 font-bold">MATHLAB EXPERIENCE</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-blue-500 via-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">
            매일 똑똑해지는 계산 연습,
            <br className="hidden sm:block" /> 매스레빗으로 시작
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 text-sm sm:text-base leading-relaxed">
            아이 눈높이에 맞게 바로 문제지를 만들어 보세요.
          </p>

          <div className="mt-6">
            <TrackedLink
              href="/calc"
              gaEvent={GA_EVENTS.SELECT_MENU}
              gaParams={{ menu: "create_and_print" }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 text-white px-4 py-2 text-xs font-bold hover:bg-slate-800"
            >
              생성 후 바로 인쇄
              <ArrowRight className="w-4 h-4" />
            </TrackedLink>
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
                className={`group relative overflow-hidden rounded-[20px] border border-slate-200 bg-white p-8 text-center transition-all duration-200 ${m.hover} hover:shadow-lg`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${m.accent} opacity-70`} />
                <div className="relative flex flex-col items-center gap-3">
                  <Icon
                    className="w-10 h-10 text-slate-500 transition-colors group-hover:text-slate-900"
                    strokeWidth={1.5}
                  />
                  <h2 className="text-xl font-black text-slate-900">{m.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{m.desc}</p>
                  <div className="mt-1 inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-white/80 text-slate-700 border border-white/80">
                    {m.badge}
                  </div>
                  <div className="mt-1 inline-flex items-center text-sm font-black text-slate-800 bg-transparent hover:bg-transparent transition-transform duration-200">
                    시작하기 <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200" />
                  </div>
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
            gaParams={{ menu: "quick" }}
            className="inline-flex items-center gap-2 text-sm font-black text-slate-800"
          >
            빠른 시작 <UsersRound className="w-4 h-4" />
          </TrackedLink>
        </div>
      </div>
    </div>
  );
}
