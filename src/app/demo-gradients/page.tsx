import Link from "next/link";
import { ArrowRight, Link2, PencilLine, Layers, Check, UsersRound } from "lucide-react";

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
  {
    name: "블루-보라 A",
    className: "bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700",
    label: "from-blue-700 via-indigo-600 to-violet-700",
  },
  {
    name: "블루-보라 B",
    className: "bg-gradient-to-r from-sky-700 via-violet-600 to-purple-700",
    label: "from-sky-700 via-violet-600 to-purple-700",
  },
  {
    name: "블루-보라 C",
    className: "bg-gradient-to-r from-indigo-700 via-blue-500 to-fuchsia-700",
    label: "from-indigo-700 via-blue-500 to-fuchsia-700",
  },
  {
    name: "이미지 톤 라일락 1",
    className: "bg-gradient-to-r from-violet-300 via-purple-300 to-cyan-200",
    label: "from-violet-300 via-purple-300 to-cyan-200",
  },
  {
    name: "이미지 톤 라일락 2",
    className: "bg-gradient-to-r from-slate-300 via-violet-200 to-purple-300",
    label: "from-slate-300 via-violet-200 to-purple-300",
  },
  {
    name: "Smilegate 톤 1",
    className: "bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-300",
    label: "from-cyan-300 via-sky-400 to-violet-300",
  },
  {
    name: "Smilegate 톤 2",
    className: "bg-gradient-to-r from-blue-500 via-indigo-600 to-fuchsia-500",
    label: "from-blue-500 via-indigo-600 to-fuchsia-500",
  },
];

const CARD_SETS = [
  {
    name: "카드 UI 세트 1 · 기본형",
    description: "라이트 톤 + 라운드 + 70% 높이(고정형)로 실사용에 가까운 구성",
    cardClass:
      "rounded-[20px] border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
    iconClass: "text-slate-500",
    titleClass: "text-xl font-black text-slate-900",
    descClass: "text-sm text-slate-600 leading-relaxed",
    badgeClass: "mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-black bg-fuchsia-50 text-fuchsia-700",
    ctaClass: "mt-3 inline-flex items-center text-sm font-black text-slate-800",
    items: [
      {
        icon: Link2,
        title: "짝 맞추기",
        desc: "윗줄 숫자와 아랫줄 결과를 선으로 이어 보는 기본형",
        badge: "더하기 · 빼기",
        iconColor: "from-fuchsia-100/80 via-white to-rose-100/30",
      },
      {
        icon: PencilLine,
        title: "일반 연산",
        desc: "빈칸에 직접 답을 써 넣는 연습 문제",
        badge: "더하기 · 빼기 · 곱하기 · 나누기",
        iconColor: "from-sky-100/80 via-white to-sky-100/30",
      },
      {
        icon: Layers,
        title: "일반 연산 (3수)",
        desc: "세 개 수를 조합한 단계형 연산 문제",
        badge: "a ○ b ○ c = ?",
        iconColor: "from-emerald-100/70 via-white to-emerald-100/25",
      },
    ],
  },
  {
    name: "카드 UI 세트 2 · 보더 강조형",
    description: "컨텐츠 여백을 넓혀 가독성을 올린 중립형",
    cardClass:
      "rounded-2xl border border-slate-300 bg-white/95 p-7 h-[70%] min-h-[260px] transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
    iconClass: "text-slate-600",
    titleClass: "text-lg font-black text-slate-900",
    descClass: "text-sm text-slate-600 leading-relaxed mt-2",
    badgeClass: "mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-black bg-sky-50 text-sky-700",
    ctaClass: "mt-4 inline-flex items-center text-sm font-black text-slate-800",
    items: [
      {
        icon: UsersRound,
        title: "짝 맞추기",
        desc: "간단한 연산 짝 맞추기 트레이닝",
        badge: "더하기 · 빼기",
        iconColor: "from-blue-100/60 via-white to-indigo-100/25",
      },
      {
        icon: PencilLine,
        title: "일반 연산",
        desc: "직접 입력 방식으로 풀이 속도 강화",
        badge: "더하기 · 빼기 · 곱하기 · 나누기",
        iconColor: "from-teal-100/70 via-white to-cyan-100/25",
      },
      {
        icon: Layers,
        title: "일반 연산 (3수)",
        desc: "3수 연산으로 난이도와 집중도를 업",
        badge: "a ○ b ○ c = ?",
        iconColor: "from-violet-100/70 via-white to-fuchsia-100/25",
      },
    ],
  },
  {
    name: "카드 UI 세트 3 · 미니멀형",
    description: "카드 내부 요소 밀도를 줄여 70% 높이 느낌으로 정돈",
    cardClass:
      "rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm h-[70%] min-h-[250px] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
    iconClass: "text-slate-700",
    titleClass: "text-base font-black text-slate-900",
    descClass: "text-sm text-slate-600 leading-relaxed",
    badgeClass: "mt-2 inline-flex items-center rounded-md px-3 py-1 text-xs font-black bg-emerald-50 text-emerald-700",
    ctaClass: "mt-3 inline-flex items-center text-sm font-black text-slate-800",
    items: [
      {
        icon: Check,
        title: "짝 맞추기",
        desc: "선 연결 방식으로 핵심 연산 파악",
        badge: "더하기 · 빼기",
        iconColor: "from-fuchsia-50 via-white to-rose-50",
      },
      {
        icon: Link2,
        title: "일반 연산",
        desc: "반복 입력으로 실력 정착",
        badge: "더하기 · 빼기 · 곱하기 · 나누기",
        iconColor: "from-sky-50 via-white to-blue-50",
      },
      {
        icon: Layers,
        title: "일반 연산 (3수)",        
        desc: "3단계 계산 조합형 문제 구성",
        badge: "a ○ b ○ c = ?",
        iconColor: "from-emerald-50 via-white to-teal-50",
      },
    ],
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
            아래 10개 샘플을 실제 화면에서 비교해봐. 맘에 드는 톤으로 바로 메인 타이틀에 적용 가능.
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

        <section className="mt-12 space-y-7">
          <h2 className="text-xl font-black text-slate-900">카드 UI 샘플 (세트 3종)</h2>
          {CARD_SETS.map((set) => (
            <div key={set.name} className="rounded-[24px] border border-slate-200 bg-white/95 p-5 sm:p-6">
              <p className="text-xs tracking-[0.2em] text-slate-500 font-bold">CARD SET</p>
              <h3 className="mt-1 text-lg sm:text-2xl font-black text-slate-900">{set.name}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{set.description}</p>
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                {set.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={`${set.name}-${item.title}`}
                      className={`${set.cardClass} relative overflow-hidden`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${item.iconColor} opacity-70`}
                      />
                      <div className="relative flex h-full flex-col">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 border border-slate-200">
                          <Icon className={`h-4 w-4 ${set.iconClass}`} strokeWidth={2} />
                        </div>
                        <h4 className={`mt-3 ${set.titleClass}`}>{item.title}</h4>
                        <p className={set.descClass}>{item.desc}</p>
                        <p className={set.badgeClass}>{item.badge}</p>
                        <p className={`mt-auto ${set.ctaClass}`}>
                          시작하기
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
