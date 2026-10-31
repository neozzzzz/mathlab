"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import {
  Bike,
  BookOpen,
  ChefHat,
  Clapperboard,
  Dumbbell,
  Footprints,
  Music,
  Palette,
  PencilLine,
  Printer,
  Puzzle,
  Tv,
  Waves,
  type LucideIcon,
} from "lucide-react";
import {
  parseTimeParams,
  generateTimeAllSheets,
  formatHoursMinutes,
  formatTimeValue,
  type TimeConvertProblem,
  type TimeCompareProblem,
  type TimeSplitProblem,
  type TimeActivityProblem,
  type TimeWordProblem,
  type TimeConvertFormat,
  type TimeMode,
  type TimeProblem,
} from "@/lib/math-generator";
import { trackEvent, GA_EVENTS } from "@/lib/ga";
import { NumberBox } from "@/components/math/BoxCell";
import { printAfterPaint } from "@/lib/print";

const SHEET_COPY: Record<TimeMode, { title: string; instruction: string }> = {
  time_convert: { title: "시간 단위 바꾸기", instruction: "빈칸에 알맞은 수를 써넣으세요." },
  time_compare: { title: "더 긴 시간 고르기", instruction: "더 긴 시간에 O 표 하세요." },
  time_split: { title: "1시간 = 60분 이용하기", instruction: "1시간 = 60분을 이용해 빈칸에 알맞은 수를 써넣으세요." },
};

// 단위 바꾸기에서 여러 형식을 섞으면 형식마다 구역을 나누고 구역 머리에 이 안내를 적는다.
const FORMAT_INSTRUCTION: Record<TimeConvertFormat, string> = {
  direct: "빈칸에 알맞은 수를 써넣으세요.",
  compare: "더 긴 시간에 O 표 하세요.",
  activity: "주어진 활동을 하는 데 걸린 시간입니다. 빈칸에 알맞은 수를 써넣으세요.",
  word: "물음에 답하세요.",
};

const KIND_FORMAT: Record<string, TimeConvertFormat> = {
  time_convert: "direct",
  time_compare: "compare",
  time_activity: "activity",
  time_word: "word",
};

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  drawing: Palette,
  piano: Music,
  reading: BookOpen,
  swimming: Waves,
  tv: Tv,
  bike: Bike,
  exercise: Dumbbell,
  homework: PencilLine,
  walking: Footprints,
  puzzle: Puzzle,
  cooking: ChefHat,
  movie: Clapperboard,
};

function ProblemNumber({ number }: { number: number }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold shrink-0">
      {number}
    </span>
  );
}

function AnswerBox({ width }: { width: string }) {
  return <NumberBox tone="answer" width={width} height="2.2rem" align="center" style={{ borderColor: "#c8c8c8" }} />;
}

// 같은 열(유형)의 줄이 모두 같은 칸 위치를 쓰도록 고정 폭 grid로 배치한다.
// 왼쪽 열: [번호] [○시간 ○분] [=] [답 칸] [분]
// 오른쪽 열: [번호] [○분] [=] [답 칸] [시간] [답 칸] [분]
const CONVERT_GRID: React.CSSProperties = {
  display: "grid",
  columnGap: 6,
  alignItems: "center",
  fontSize: "1.1rem",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const CONVERT_COLUMNS: Record<TimeConvertProblem["direction"], string> = {
  to_minutes: "24px 5.6em 1em 3.4rem 1.1em",
  to_hours: "24px 3.2em 1em 2.8rem 2.1em 2.8rem 1.1em",
};

function ConvertRow({ problem, number }: { problem: TimeConvertProblem; number: number }) {
  const toMinutes = problem.direction === "to_minutes";
  return (
    <div style={{ ...CONVERT_GRID, gridTemplateColumns: CONVERT_COLUMNS[problem.direction] }}>
      <ProblemNumber number={number} />
      <span style={{ textAlign: "right" }}>
        {toMinutes ? formatHoursMinutes(problem.minutes) : `${problem.minutes}분`}
      </span>
      <span style={{ textAlign: "center" }}>=</span>
      <AnswerBox width="100%" />
      <span>{toMinutes ? "분" : "시간"}</span>
      {toMinutes ? null : (
        <>
          <AnswerBox width="100%" />
          <span>분</span>
        </>
      )}
    </div>
  );
}

// 60분 이용해 바꾸기: 첫 줄 [번호] [시작 시간] [=] [○시간을 분으로] [+] [나머지 분],
// 둘째 줄은 [=] 칸 아래에서 시작해 답을 적는다. 같은 열의 칸 위치를 맞추려고 고정 폭 grid를 쓴다.
const SPLIT_COLUMNS: Record<TimeSplitProblem["direction"], string> = {
  to_minutes: "24px 5.6em 1em 4.4rem 1em 4.4rem",
  to_hours: "24px 3.2em 1em 4.4rem 1em 4.4rem",
};

function MinutesPart({ value, blank }: { value: number; blank: boolean }) {
  if (!blank) return <span style={{ textAlign: "center" }}>{value}분</span>;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <AnswerBox width="2.8rem" />
      <span>분</span>
    </span>
  );
}

function SplitRow({ problem, number }: { problem: TimeSplitProblem; number: number }) {
  const toMinutes = problem.direction === "to_minutes";
  const showHours = !toMinutes && problem.blank === "none";
  return (
    <div style={{ ...CONVERT_GRID, gridTemplateColumns: SPLIT_COLUMNS[problem.direction], rowGap: 10 }}>
      <ProblemNumber number={number} />
      <span style={{ textAlign: "right" }}>
        {toMinutes ? formatHoursMinutes(problem.minutes) : `${problem.minutes}분`}
      </span>
      <span style={{ textAlign: "center" }}>=</span>
      <MinutesPart value={problem.hours * 60} blank={problem.blank === "hours"} />
      <span style={{ textAlign: "center" }}>+</span>
      <MinutesPart value={problem.restMinutes} blank={problem.blank === "rest"} />

      <span style={{ gridColumn: 3, textAlign: "center" }}>=</span>
      <span style={{ gridColumn: "4 / -1", display: "flex", alignItems: "center", gap: 4 }}>
        {toMinutes ? null : showHours ? (
          <span>{problem.hours}시간</span>
        ) : (
          <>
            <AnswerBox width="2.8rem" />
            <span>시간</span>
          </>
        )}
        <AnswerBox width={toMinutes ? "3.4rem" : "2.8rem"} />
        <span>분</span>
      </span>
    </div>
  );
}

/** 답 칸: to_minutes 는 [ ]분, to_hours 는 [ ]시간 [ ]분 */
function HoursMinutesAnswer({ direction }: { direction: "to_minutes" | "to_hours" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {direction === "to_hours" ? (
        <>
          <AnswerBox width="2.8rem" />
          <span>시간</span>
        </>
      ) : null}
      <AnswerBox width={direction === "to_hours" ? "2.8rem" : "3.4rem"} />
      <span>분</span>
    </span>
  );
}

function ActivityRow({ problem, number }: { problem: TimeActivityProblem; number: number }) {
  const Icon = ACTIVITY_ICONS[problem.activityId] ?? Palette;
  const shown = problem.direction === "to_hours" ? `${problem.minutes}분` : formatHoursMinutes(problem.minutes);
  return (
    <div className="flex items-center gap-3 min-w-0" style={{ fontSize: "1.1rem", fontWeight: 600, whiteSpace: "nowrap" }}>
      <ProblemNumber number={number} />
      <span
        aria-hidden
        className="inline-flex items-center justify-center shrink-0"
        style={{ width: 52, height: 52, borderRadius: 12, border: "1.5px solid #d4d4d8" }}
      >
        <Icon size={30} strokeWidth={1.5} />
      </span>
      <div className="flex flex-col min-w-0" style={{ gap: 6 }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: ".85rem", fontWeight: 500, color: "#666" }}>{problem.activityName}</span>
          <span>{shown}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>→</span>
          <HoursMinutesAnswer direction={problem.direction} />
        </span>
      </div>
    </div>
  );
}

function WordRow({ problem, number }: { problem: TimeWordProblem; number: number }) {
  const question =
    problem.direction === "to_hours"
      ? `${problem.minutes}분은 몇 시간 몇 분인가요?`
      : `${formatHoursMinutes(problem.minutes)}은 몇 분인가요?`;
  return (
    <div className="flex flex-col min-w-0" style={{ gap: 8, fontSize: "1.05rem", fontWeight: 600, whiteSpace: "nowrap" }}>
      <span className="flex items-center gap-3">
        <ProblemNumber number={number} />
        <span>{question}</span>
      </span>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, paddingRight: 8 }}>
        <span style={{ fontSize: ".9rem", color: "#666" }}>답</span>
        <HoursMinutesAnswer direction={problem.direction} />
      </span>
    </div>
  );
}

/** 두 열 grid. 문제 번호는 왼쪽 → 오른쪽, 위 → 아래 순. 줄 높이는 남은 높이에 고르게 나눈다. */
function TwoColumnGrid({ rows, minRow, children }: { rows: number; minRow: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gridTemplateRows: `repeat(${rows}, minmax(${minRow}, 1fr))`,
        alignItems: "center",
        columnGap: 32,
        color: "#2f2f2f",
      }}
    >
      {children}
    </div>
  );
}

function FormatBody({ format, problems, start }: { format: TimeConvertFormat; problems: TimeProblem[]; start: number }) {
  const rows = Math.max(Math.ceil(problems.length / 2), 1);
  switch (format) {
    case "direct":
      return <ConvertColumns problems={problems as TimeConvertProblem[]} start={start} />;
    case "compare":
      return (
        <TwoColumnGrid rows={rows} minRow="3.6rem">
          {(problems as TimeCompareProblem[]).map((p, i) => (
            <CompareRow key={`m-${p.left.minutes}-${p.right.minutes}`} problem={p} number={start + i} />
          ))}
        </TwoColumnGrid>
      );
    case "activity":
      return (
        <TwoColumnGrid rows={rows} minRow="4.6rem">
          {(problems as TimeActivityProblem[]).map((p, i) => (
            <ActivityRow key={`a-${p.activityId}`} problem={p} number={start + i} />
          ))}
        </TwoColumnGrid>
      );
    case "word":
      return (
        <TwoColumnGrid rows={rows} minRow="4.3rem">
          {(problems as TimeWordProblem[]).map((p, i) => (
            <WordRow key={`w-${p.direction}-${p.minutes}`} problem={p} number={start + i} />
          ))}
        </TwoColumnGrid>
      );
  }
}

/** 단위 바꾸기 문제를 형식별로 묶는다(생성 순서 = 바로 바꾸기 → 더 긴 시간 → 활동 → 문장). */
function groupByFormat(problems: TimeProblem[]) {
  const groups: { format: TimeConvertFormat; problems: TimeProblem[]; start: number }[] = [];
  problems.forEach((p, i) => {
    const format = KIND_FORMAT[p.kind];
    const last = groups[groups.length - 1];
    if (last && last.format === format) last.problems.push(p);
    else groups.push({ format, problems: [p], start: i + 1 });
  });
  return groups;
}

function CompareRow({ problem, number }: { problem: TimeCompareProblem; number: number }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <ProblemNumber number={number} />
      <div className="grid grid-cols-2 flex-1 min-w-0">
        {[problem.left, problem.right].map((value, idx) => (
          <div
            key={idx}
            className="text-center whitespace-nowrap"
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              padding: "16px 4px",
            }}
          >
            {formatTimeValue(value)}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimeSheet({
  problems,
  mode,
  count,
  sheetNum,
  totalSheets,
}: {
  problems: TimeProblem[];
  mode: TimeMode;
  count: number;
  sheetNum: number;
  totalSheets: number;
}) {
  const copy = SHEET_COPY[mode];
  const compareRows = Math.max(Math.ceil(problems.length / 2), 1);
  const groups = mode === "time_convert" ? groupByFormat(problems) : [];
  const mixed = groups.length > 1;
  // 단위 바꾸기에서 한 형식만 고르면 그 형식의 안내를 맨 위에 적는다.
  const instruction = mode === "time_convert" && groups.length === 1 ? FORMAT_INSTRUCTION[groups[0].format] : copy.instruction;

  return (
    <div className="sheet bg-white mx-auto flex flex-col" style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box", padding: "10mm 12mm", fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif" }}>
      <div className="flex justify-between items-center text-sm mb-4 text-gray-500">
        <div className="flex" style={{ gap: 40 }}>
          <span>날짜: ___________</span>
          <span>이름: ___________</span>
        </div>
        <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {count}</span>
      </div>
      <div className="mb-3 text-center" style={{ fontSize: "1.4rem", fontWeight: 900 }}>
        {copy.title}
        {totalSheets > 1 && <span className="text-sm font-normal text-gray-500 ml-2">({sheetNum}/{totalSheets})</span>}
      </div>
      {mixed ? (
        <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: 8 }} />
      ) : (
        <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#555", borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 20 }}>
          {instruction}
        </div>
      )}

      {mode === "time_convert" ? (
        mixed ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {groups.map((group) => (
              <section
                key={group.format}
                // 구역마다 내용 높이를 먼저 확보하고, 남는 높이만 줄 수에 비례해 나눈다.
                style={{ flex: `${Math.ceil(group.problems.length / 2)} 1 auto`, display: "flex", flexDirection: "column", marginTop: 12 }}
              >
                <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#555", marginBottom: 6 }}>
                  {FORMAT_INSTRUCTION[group.format]}
                </div>
                <FormatBody format={group.format} problems={group.problems} start={group.start} />
              </section>
            ))}
          </div>
        ) : groups.length === 1 ? (
          <FormatBody format={groups[0].format} problems={groups[0].problems} start={1} />
        ) : null
      ) : mode === "time_split" ? (
        <SplitColumns problems={problems as TimeSplitProblem[]} />
      ) : (
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            // 단위 바꾸기와 같이 줄 높이를 남은 높이에 고르게 나눠 아래가 비지 않게 한다.
            gridTemplateRows: `repeat(${compareRows}, minmax(3.6rem, 1fr))`,
            alignItems: "center",
            columnGap: 32,
            color: "#2f2f2f",
          }}
        >
          {(problems as TimeCompareProblem[]).map((p, i) => (
            <CompareRow key={`m-${p.left.minutes}-${p.right.minutes}`} problem={p} number={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 왼쪽 열은 "○시간 ○분 = [ ]분", 오른쪽 열은 "○분 = [ ]시간 [ ]분".
 * 줄 높이를 남은 높이에 고르게 나눠 문제지 아래가 비지 않게 한다.
 */
function ConvertColumns({ problems, start = 1 }: { problems: TimeConvertProblem[]; start?: number }) {
  const left = problems.filter((p) => p.direction === "to_minutes");
  const right = problems.filter((p) => p.direction === "to_hours");
  const rows = Math.max(left.length, right.length, 1);
  const columnStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateRows: `repeat(${rows}, minmax(3.2rem, 1fr))`,
    alignItems: "center",
  };

  return (
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", columnGap: 32, color: "#2f2f2f" }}>
      <div style={columnStyle}>
        {left.map((p, i) => (
          <ConvertRow key={`c-${p.direction}-${p.minutes}`} problem={p} number={start + i} />
        ))}
      </div>
      <div style={columnStyle}>
        {right.map((p, i) => (
          <ConvertRow key={`c-${p.direction}-${p.minutes}`} problem={p} number={start + left.length + i} />
        ))}
      </div>
    </div>
  );
}

/** 단위 바꾸기와 같은 배치: 왼쪽 열은 시간·분 → 분, 오른쪽 열은 분 → 시간·분. */
function SplitColumns({ problems }: { problems: TimeSplitProblem[] }) {
  const left = problems.filter((p) => p.direction === "to_minutes");
  const right = problems.filter((p) => p.direction === "to_hours");
  const rows = Math.max(left.length, right.length, 1);
  const columnStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateRows: `repeat(${rows}, minmax(6rem, 1fr))`,
    alignItems: "center",
  };

  return (
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", columnGap: 24, color: "#2f2f2f" }}>
      <div style={columnStyle}>
        {left.map((p, i) => (
          <SplitRow key={`s-${p.direction}-${p.minutes}`} problem={p} number={i + 1} />
        ))}
      </div>
      <div style={columnStyle}>
        {right.map((p, i) => (
          <SplitRow key={`s-${p.direction}-${p.minutes}`} problem={p} number={left.length + i + 1} />
        ))}
      </div>
    </div>
  );
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const params = useMemo(() => parseTimeParams(searchParams), [searchParams]);
  const allSheets = useMemo(() => (params ? generateTimeAllSheets(params, queryString) : []), [params, queryString]);

  if (!params) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-sm">
          <p className="text-lg font-bold mb-4">잘못된 접근입니다</p>
          <Link href="/time" className="text-blue-600 underline">돌아가기</Link>
        </div>
      </div>
    );
  }

  const expectedCount = params.count * params.sheets;
  const generatedCount = allSheets.reduce((acc, problems) => acc + problems.length, 0);

  return (
    <div className="min-h-[100dvh] bg-slate-100/80">
      <div className="print:hidden border-b bg-white">
        <div className="max-w-[880px] mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href="/time"
            onClick={() => trackEvent(GA_EVENTS.NAV_BACK, { from: "time_preview" })}
            className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold"
          >
            <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
            <span className="ml-1 transition-all duration-150 group-hover:font-bold">설정으로 돌아가기</span>
          </Link>

          <button
            onClick={() => {
              trackEvent(GA_EVENTS.PRINT, { page: "time" });
              printAfterPaint();
            }}
            className="w-fit px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer"
          >
            <Printer className="w-4 h-4 inline mr-1" strokeWidth={1.5} />인쇄
          </button>
        </div>
      </div>

      {generatedCount !== expectedCount ? (
        <div className="print:hidden max-w-[800px] mx-auto mt-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-lg mb-3 text-amber-900 text-sm">
          <p className="font-bold mb-2">시간 범위가 좁아 요청한 문제 수를 모두 만들지 못했습니다.</p>
          <p>
            목표: <span className="font-bold">{expectedCount}문제</span> · 생성됨: <span className="font-bold">{generatedCount}문제</span>
          </p>
        </div>
      ) : null}

      {allSheets.map((problems, index) => (
        <div key={index} className={index < allSheets.length - 1 ? "break-after-page" : ""}>
          <TimeSheet
            problems={problems}
            mode={params.mode}
            count={params.count}
            sheetNum={index + 1}
            totalSheets={params.sheets}
          />
        </div>
      ))}
    </div>
  );
}

export default function TimePreviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">로딩 중...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
