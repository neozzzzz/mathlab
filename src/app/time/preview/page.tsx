"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import {
  parseTimeParams,
  generateTimeAllSheets,
  formatHoursMinutes,
  formatTimeValue,
  type TimeConvertProblem,
  type TimeCompareProblem,
  type TimeMode,
  type TimeProblem,
} from "@/lib/math-generator";
import { trackEvent, GA_EVENTS } from "@/lib/ga";
import { NumberBox } from "@/components/math/BoxCell";

const SHEET_COPY: Record<TimeMode, { title: string; instruction: string }> = {
  time_convert: { title: "시간 단위 바꾸기", instruction: "빈칸에 알맞은 수를 써넣으세요." },
  time_compare: { title: "더 긴 시간 고르기", instruction: "더 긴 시간에 O 표 하세요." },
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

// 모든 줄이 같은 열을 쓰도록 고정 폭 grid로 배치한다.
// [번호] [문제 시간(오른쪽 정렬)] [=] [답 칸] [단위] [답 칸] [단위]
const CONVERT_GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "24px 5.6em 1em 2.8rem 2.1em 2.8rem 1.1em",
  columnGap: 6,
  alignItems: "center",
  fontSize: "1.1rem",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

function ConvertRow({ problem, number }: { problem: TimeConvertProblem; number: number }) {
  const toMinutes = problem.direction === "to_minutes";
  return (
    <div style={CONVERT_GRID}>
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

function CompareRow({ problem, number }: { problem: TimeCompareProblem; number: number }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <ProblemNumber number={number} />
      <div className="grid grid-cols-2 flex-1 min-w-0" style={{ border: "1px solid #d2d2d2" }}>
        {[problem.left, problem.right].map((value, idx) => (
          <div
            key={idx}
            className="text-center whitespace-nowrap"
            style={{
              borderLeft: idx === 1 ? "1px solid #d2d2d2" : undefined,
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

  return (
    <div className="sheet bg-white mx-auto" style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box", padding: "10mm 12mm", fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif" }}>
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
      <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#555", borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 20 }}>
        {copy.instruction}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", rowGap: mode === "time_convert" ? 28 : 16, columnGap: 32, color: "#2f2f2f" }}>
        {problems.map((p, i) =>
          p.kind === "time_convert" ? (
            <ConvertRow key={`c-${p.direction}-${p.minutes}`} problem={p} number={i + 1} />
          ) : (
            <CompareRow key={`m-${p.left.minutes}-${p.right.minutes}`} problem={p} number={i + 1} />
          ),
        )}
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
              window.print();
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
