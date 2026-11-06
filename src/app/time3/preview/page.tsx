"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import {
  parseTime3Params,
  generateTime3AllSets,
  layoutTime3Set,
  formatClockDigits,
  formatClockKorean,
  formatHoursMinutes,
  TIME3_SET_ORDER,
  type Time3Problem,
  type Time3ActivityRange,
} from "@/lib/math-generator";
import { trackEvent, GA_EVENTS } from "@/lib/ga";
import { AnalogClock } from "@/components/math/AnalogClock";
import { printAfterPaint } from "@/lib/print";

const LAYOUT = layoutTime3Set();

function Question({ number, children }: { number: number; children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 6, fontSize: ".95rem", fontWeight: 600, lineHeight: 1.55, wordBreak: "keep-all" }}>
      <span style={{ fontWeight: 800, minWidth: "1.6em" }}>{number}.</span>
      <span>{children}</span>
    </div>
  );
}

/** 교재처럼 오른쪽 아래 [          ] 답 칸 */
function Bracket({ label }: { label?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginTop: 8, fontSize: "1.05rem", color: "#52525b" }}>
      {label && <span style={{ fontSize: ".85rem", fontWeight: 700 }}>{label}</span>}
      <span>[</span>
      <span style={{ display: "inline-block", width: "8.5em" }} />
      <span>]</span>
    </div>
  );
}

const indent: CSSProperties = { marginLeft: "1.9em" };

/** 문제 속 정보를 담는 둥근 상자 */
function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        ...indent,
        marginTop: 8,
        width: "fit-content",
        border: "1.5px solid #d4d4d8",
        borderRadius: 10,
        padding: "6px 14px",
        fontSize: ".95rem",
        fontWeight: 600,
        lineHeight: 1.7,
        background: "#fafafa",
      }}
    >
      {children}
    </div>
  );
}

function Tag({ children, color = "#fde68a" }: { children: ReactNode; color?: string }) {
  return (
    <span style={{ display: "inline-block", background: color, borderRadius: 6, padding: "1px 10px", fontSize: ".8rem", fontWeight: 700, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function LabeledClock({ label, minute, size = 92, mirror, hideHands, shadeFromMinute, color }: {
  label?: string;
  minute: number;
  size?: number;
  mirror?: boolean;
  hideHands?: boolean;
  shadeFromMinute?: number;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      {label && <Tag color={color}>{label}</Tag>}
      <AnalogClock
        minuteOfDay={minute}
        size={size}
        mirror={mirror}
        hideHands={hideHands}
        shadeFromMinute={shadeFromMinute}
        label={hideHands ? `${label ?? "시계"} (바늘 없음)` : `${label ?? "시계"} ${formatClockKorean(minute)}`}
      />
    </div>
  );
}

function ClockPair({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 8 }}>
      {left}
      <span style={{ fontSize: "1.2rem", color: "#a1a1aa", marginTop: 18 }}>→</span>
      {right}
    </div>
  );
}

function DigitalClock({ minute }: { minute: number }) {
  return (
    <div
      aria-label={`디지털 시계 ${formatClockDigits(minute)}`}
      style={{
        border: "3px solid #52525b",
        borderRadius: 8,
        padding: "6px 14px",
        fontFamily: "'Courier New', monospace",
        fontSize: "1.5rem",
        fontWeight: 800,
        letterSpacing: 2,
        background: "#f4f4f5",
      }}
    >
      {formatClockDigits(minute)}
    </div>
  );
}

function Person({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {children}
      <span style={{ fontSize: ".85rem", fontWeight: 700 }}>{name}</span>
    </div>
  );
}

function Bubble({ children }: { children: ReactNode }) {
  return (
    <div style={{ border: "1.5px solid #a1a1aa", borderRadius: 14, padding: "6px 10px", fontSize: ".82rem", fontWeight: 600, lineHeight: 1.45, background: "#fff", wordBreak: "keep-all" }}>
      {children}
    </div>
  );
}

/** 왼쪽·오른쪽 항목을 점으로 잇는 문제(줄 수가 달라도 위아래 가운데에 맞춘다) */
function MatchBoard({ left, right }: { left: ReactNode[]; right: ReactNode[] }) {
  const dot = <span style={{ width: 7, height: 7, borderRadius: 9, background: "#3f3f46", display: "inline-block", flexShrink: 0 }} />;
  const column = (items: ReactNode[], side: "left" | "right") => (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: side === "left" ? "row" : "row-reverse" }}>
          {item}
          {dot}
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ ...indent, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "stretch", paddingRight: 4 }}>
      {column(left, "left")}
      {column(right, "right")}
    </div>
  );
}

function MatchCard({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span style={{ display: "inline-block", background: color, border: "1px solid #d4d4d8", borderRadius: 6, padding: "4px 10px", fontSize: ".92rem", fontWeight: 700, textAlign: "center", lineHeight: 1.35, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function rangeCard(range: Time3ActivityRange, color: string) {
  return (
    <MatchCard color={color}>
      {range.name}
      <br />
      {formatClockDigits(range.start)}~{formatClockDigits(range.end)}
    </MatchCard>
  );
}

function SubQuestion({ mark, children }: { mark: string; children: ReactNode }) {
  return (
    <div style={{ ...indent, display: "flex", gap: 4, marginTop: 8, fontSize: ".92rem", fontWeight: 600, lineHeight: 1.5, wordBreak: "keep-all" }}>
      <span>{mark}</span>
      <span>{children}</span>
    </div>
  );
}

function WritingLines({ count }: { count: number }) {
  return (
    <div style={{ ...indent, marginTop: 4 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ height: 26, borderBottom: "1px solid #d4d4d8" }} />
      ))}
    </div>
  );
}

function ProblemBlock({ problem, number }: { problem: Time3Problem; number: number }) {
  switch (problem.kind) {
    case "describe":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <InfoBox>
            <div>• {problem.lines[0]}</div>
            <div>• {problem.lines[1]}</div>
          </InfoBox>
          <Bracket />
        </div>
      );
    case "describe_before":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <Bracket />
        </div>
      );
    case "describe_talk":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <div style={{ ...indent, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
            {problem.names.map((name, i) => (
              <Person key={name} name={name}>
                <Bubble>{problem.lines[i]}</Bubble>
              </Person>
            ))}
          </div>
          <Bracket />
        </div>
      );
    case "compare_two":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <div style={{ ...indent, display: "flex", justifyContent: "space-around", marginTop: 8 }}>
            {problem.names.map((name, i) => (
              <Person key={name} name={name}>
                <MatchCard color="#d1fae5">{problem.labels[i]}</MatchCard>
              </Person>
            ))}
          </div>
          <Bracket />
        </div>
      );
    case "compare_clock_digital":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <div style={{ ...indent, display: "flex", justifyContent: "space-around", alignItems: "flex-end", marginTop: 8 }}>
            <Person name={problem.names[0]}>
              <AnalogClock minuteOfDay={problem.times[0]} size={88} label={`${problem.names[0]} 시계 ${formatClockKorean(problem.times[0])}`} />
            </Person>
            <Person name={problem.names[1]}>
              <DigitalClock minute={problem.times[1]} />
            </Person>
          </div>
          <Bracket />
        </div>
      );
    case "order_three":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <InfoBox>
            {problem.names.map((name, i) => (
              <div key={name}>
                {name}: {problem.labels[i]}
              </div>
            ))}
          </InfoBox>
          <SubQuestion mark="(1)">{problem.question1}</SubQuestion>
          <Bracket />
          <SubQuestion mark="(2)">{problem.question2}</SubQuestion>
          <Bracket />
        </div>
      );
    case "latest_clock":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
            {problem.activities.map((activity, i) => (
              <Person key={activity} name={activity}>
                <AnalogClock minuteOfDay={problem.times[i]} size={82} label={`${activity} ${formatClockKorean(problem.times[i])}`} />
              </Person>
            ))}
          </div>
          <Bracket />
        </div>
      );
    case "mirror_read":
    case "mirror_before":
      return (
        <div>
          {/* 문장이 '오른쪽은 거울에 비친 시계'라고 가리키므로 시계를 문장 오른쪽에 둔다. */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <Question number={number}>{problem.text}</Question>
            </div>
            <MirrorFrame>
              <AnalogClock minuteOfDay={problem.time} size={84} mirror label="거울에 비친 시계" />
            </MirrorFrame>
          </div>
          <Bracket />
        </div>
      );
    case "mirror_who":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <div style={{ ...indent, display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <MirrorFrame>
              <AnalogClock minuteOfDay={problem.time} size={92} mirror label="거울에 비친 시계" />
            </MirrorFrame>
            <div style={{ background: "#fef3c7", borderRadius: 8, padding: "6px 10px", fontSize: ".9rem", fontWeight: 600, lineHeight: 1.7 }}>
              {problem.statements.map((s) => (
                <div key={s.name}>
                  {s.name}: {formatClockKorean(s.time)}이야.
                </div>
              ))}
            </div>
          </div>
          <Bracket />
        </div>
      );
    case "match_convert":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <MatchBoard
            left={problem.left.map((m) => <MatchCard key={m} color="#e0f2fe">{formatHoursMinutes(m)}</MatchCard>)}
            right={problem.right.map((m) => <MatchCard key={m} color="#fef9c3">{m}분</MatchCard>)}
          />
        </div>
      );
    case "find_wrong":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <InfoBox>
            {problem.items.map((item) => (
              <div key={item.symbol}>
                {item.symbol} {item.left} = {item.right}
              </div>
            ))}
          </InfoBox>
          <Bracket />
        </div>
      );
    case "sum_blanks":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <InfoBox>
            <div>• {problem.minutesA}분 = {Math.floor(problem.minutesA / 60)}시간 ㉠분</div>
            <div>• {formatHoursMinutes(problem.hoursB * 60 + problem.minutesB)} = ㉡분</div>
          </InfoBox>
          <Bracket />
        </div>
      );
    case "compare_duration":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <Bracket />
        </div>
      );
    case "clock_elapsed":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <ClockPair
            left={<LabeledClock label={problem.labels[0]} minute={problem.start} color="#fbcfe8" />}
            right={<LabeledClock label={problem.labels[1]} minute={problem.end} color="#fbcfe8" />}
          />
          <Bracket />
        </div>
      );
    case "until_clock":
      return (
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <Question number={number}>{problem.text}</Question>
            </div>
            <AnalogClock minuteOfDay={problem.end} size={84} label={`오른쪽 시계 ${formatClockKorean(problem.end)}`} />
          </div>
          <Bracket />
        </div>
      );
    case "remaining":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <ClockPair
            left={<LabeledClock label={problem.labels[0]} minute={problem.start} color="#bbf7d0" />}
            right={<LabeledClock label={problem.labels[1]} minute={problem.now} shadeFromMinute={problem.start} color="#bbf7d0" />}
          />
          <Bracket />
        </div>
      );
    case "match_elapsed":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <MatchBoard
            left={problem.left.map((r) => <span key={r.name}>{rangeCard(r, "#dcfce7")}</span>)}
            right={problem.right.map((r) => <span key={r.name}>{rangeCard(r, "#fef9c3")}</span>)}
          />
        </div>
      );
    case "draw_end":
    case "draw_end_repeat":
      return (
        <div>
          <Question number={number}>{problem.text}</Question>
          <ClockPair
            left={<LabeledClock label="시작한 시각" minute={problem.start} color="#fed7aa" />}
            right={<LabeledClock label="끝난 시각" minute={problem.answer} hideHands color="#fed7aa" />}
          />
        </div>
      );
    case "essay_arrival":
      return (
        <div>
          <Question number={number}>
            <span style={{ display: "inline-block", border: "1px solid #a1a1aa", borderRadius: 4, padding: "0 5px", fontSize: ".75rem", marginRight: 4 }}>서술형</span>
            {problem.text}
          </Question>
          <SubQuestion mark="①">{problem.steps[0]}</SubQuestion>
          <WritingLines count={2} />
          <SubQuestion mark="②">{problem.steps[1]}</SubQuestion>
          <WritingLines count={2} />
          <Bracket label="답" />
        </div>
      );
  }
}

/** 거울에 비친 시계를 담는 액자 */
function MirrorFrame({ children }: { children: ReactNode }) {
  return <div style={{ border: "6px solid #c4b5fd", borderRadius: 6, padding: 4, background: "#f5f3ff", lineHeight: 0 }}>{children}</div>;
}

function Time3Sheet({ problems, setNum, totalSets, page }: { problems: Time3Problem[]; setNum: number; totalSets: number; page: number }) {
  const columns = LAYOUT[page];
  return (
    <div className="sheet bg-white mx-auto flex flex-col" style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box", padding: "10mm 12mm", fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif", color: "#2f2f2f" }}>
      <div className="flex justify-between items-center text-sm mb-3 text-gray-500">
        <div className="flex" style={{ gap: 40 }}>
          <span>날짜: ___________</span>
          <span>이름: ___________</span>
        </div>
        {page === 0 ? <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {TIME3_SET_ORDER.length}</span> : <span />}
      </div>
      <div className="text-center" style={{ fontSize: "1.3rem", fontWeight: 900, borderBottom: "1px solid #e5e7eb", paddingBottom: 10, marginBottom: 14 }}>
        시각과 시간 유형 익히기
        <span className="text-sm font-normal text-gray-500 ml-2">
          ({totalSets > 1 ? `${setNum}세트 · ` : ""}
          {page + 1}/{LAYOUT.length}쪽)
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {columns.map((column, ci) => (
          <div
            key={ci}
            data-column={ci}
            style={{
              display: "flex",
              flexDirection: "column",
              rowGap: 14,
              padding: ci === 0 ? "0 16px 0 0" : "0 0 0 16px",
              borderLeft: ci === 1 ? "1px solid #d4d4d8" : undefined,
            }}
          >
            {column.map((index) => (
              // 문항 높이를 먼저 확보하고 남는 높이(풀이 공간)만 고르게 나눈다.
              <div key={index} data-kind={problems[index].kind} style={{ flex: "1 1 auto" }}>
                <ProblemBlock problem={problems[index]} number={index + 1} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const params = useMemo(() => parseTime3Params(searchParams), [searchParams]);
  const allSets = useMemo(() => (params ? generateTime3AllSets(params, queryString) : []), [params, queryString]);

  if (!params) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-sm">
          <p className="text-lg font-bold mb-4">잘못된 접근입니다</p>
          <Link href="/time3" className="text-blue-600 underline">돌아가기</Link>
        </div>
      </div>
    );
  }

  const sheets = allSets.flatMap((problems, setIndex) => LAYOUT.map((_, page) => ({ problems, setIndex, page })));

  return (
    <div className="min-h-[100dvh] bg-slate-100/80">
      <div className="print:hidden border-b bg-white">
        <div className="max-w-[880px] mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href="/time3"
            onClick={() => trackEvent(GA_EVENTS.NAV_BACK, { from: "time3_preview" })}
            className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold"
          >
            <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
            <span className="ml-1 transition-all duration-150 group-hover:font-bold">설정으로 돌아가기</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {params.sets}세트 · {sheets.length}장 · {params.sets * TIME3_SET_ORDER.length}문제
            </span>
            <button
              onClick={() => {
                trackEvent(GA_EVENTS.PRINT, { page: "time3", sets: params.sets });
                printAfterPaint();
              }}
              className="w-fit px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer"
            >
              <Printer className="w-4 h-4 inline mr-1" strokeWidth={1.5} />인쇄
            </button>
          </div>
        </div>
      </div>

      {sheets.map(({ problems, setIndex, page }, index) => (
        <div key={index} className={index < sheets.length - 1 ? "break-after-page" : ""}>
          <Time3Sheet problems={problems} setNum={setIndex + 1} totalSets={params.sets} page={page} />
        </div>
      ))}
    </div>
  );
}

export default function Time3PreviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">로딩 중...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
