import { Link2, PenLine, Layers, Sparkles } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import { GA_EVENTS } from "@/lib/ga";

const MENUS = [
  {
    href: "/match",
    title: "짝 맞추기",
    icon: Link2,
    desc: "윗줄 숫자와 아랫줄 결과를 선으로 연결해서 쓰기",
    badge: "더하기 · 빼기",
    tone: "orange",
    emoji: "A",
  },
  {
    href: "/calc",
    title: "일반 연산",
    icon: PenLine,
    desc: "빈칸에 답을 쓰는 기본 연산 연습",
    badge: "더하기 · 빼기 · 곱하기 · 나누기",
    tone: "blue",
    emoji: "B",
  },
  {
    href: "/calc3",
    title: "일반 연산 (3수)",
    icon: Layers,
    desc: "세 수 연산으로 사고력을 한번에 끌어올리기",
    badge: "a ○ b ○ c = ?",
    tone: "green",
    emoji: "C",
  },
] as const;

const TONE = {
  orange: {
    icon: "text-orange-500 group-hover:text-orange-600",
    line: "from-orange-100 via-orange-50/60 to-white",
    chip: "bg-orange-100 text-orange-700",
    border: "group-hover:border-orange-300",
  },
  blue: {
    icon: "text-blue-500 group-hover:text-blue-600",
    line: "from-blue-100 via-blue-50/60 to-white",
    chip: "bg-blue-100 text-blue-700",
    border: "group-hover:border-blue-300",
  },
  green: {
    icon: "text-emerald-500 group-hover:text-emerald-600",
    line: "from-emerald-100 via-emerald-50/60 to-white",
    chip: "bg-emerald-100 text-emerald-700",
    border: "group-hover:border-emerald-300",
  },
} as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900 py-8 sm:py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_20px_55px_rgba(15,23,42,0.08)] p-6 sm:p-8 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-xs tracking-[0.2em] text-slate-500 font-bold">MATHLAB</p>
              <h1 className="mt-2 text-4xl sm:text-5xl font-black leading-tight">수학 문제 생성기</h1>
              <p className="mt-3 text-slate-600 text-base sm:text-lg max-w-2xl">
                초등 학습지를 더 빠르게, 더 똑똑하게. 페이지 이동 없이 바로 생성하고 바로 인쇄하세요.
              </p>
            </div>
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-700" strokeWidth={2} />
              <span>V1-1 Preview</span>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          {MENUS.map((m) => {
            const Icon = m.icon;
            const tone = TONE[m.tone];
            return (
              <TrackedLink
                key={m.href}
                href={m.href}
                gaEvent={GA_EVENTS.SELECT_MENU}
                gaParams={{ menu: m.href.slice(1) }}
                className={`group relative overflow-hidden rounded-[28px] border-2 border-slate-200 bg-gradient-to-b ${tone.line} p-6 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(15,23,42,0.12)] ${tone.border}`}
              >
                <div className="absolute right-4 top-4 text-xs font-bold text-slate-500 bg-white/80 rounded-full px-2 py-1 border border-white/90">{m.emoji}</div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/90 shadow-sm mb-4">
                  <Icon className={`w-6 h-6 ${tone.icon}`} strokeWidth={2} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black mb-2">{m.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{m.desc}</p>
                <div className="mt-6 inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold bg-white/80 border border-white/90">
                  {m.badge}
                </div>
              </TrackedLink>
            );
          })}
        </section>

        <p className="mt-8 text-sm text-slate-400 text-center">로그인 없이 바로 사용 · 공유 링크 지원 · 인쇄 최적화</p>
      </div>
    </div>
  );
}
