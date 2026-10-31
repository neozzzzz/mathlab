"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import {
  parseTime2Params,
  generateTime2AllSheets,
  formatClockDigits,
  formatClockKorean,
  formatHoursMinutes,
  type Time2Problem,
  type Time2ConvertProblem,
  type Time2ScheduleProblem,
  type Time2ClockProblem,
  type Time2EndProblem,
} from "@/lib/math-generator";
import { trackEvent, GA_EVENTS } from "@/lib/ga";
import { NumberBox } from "@/components/math/BoxCell";
import { AnalogClock } from "@/components/math/AnalogClock";
import { printAfterPaint } from "@/lib/print";

function AnswerBox({ width = "2.8rem" }: { width?: string }) {
  return <NumberBox tone="answer" width={width} height="2.1rem" align="center" style={{ borderColor: "#c8c8c8" }} />;
}

/** [ ]시간 [ ]분 또는 [ ]시 [ ]분 */
function AnswerLine({ unit }: { unit: "duration" | "clock" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 10, fontWeight: 600 }}>
      <span style={{ fontSize: ".9rem", color: "#666", marginRight: 4 }}>답</span>
      <AnswerBox />
      <span>{unit === "duration" ? "시간" : "시"}</span>
      <AnswerBox />
      <span>분</span>
    </div>
  );
}

function Question({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: "1rem", fontWeight: 600, lineHeight: 1.6, wordBreak: "keep-all" }}>
      <span style={{ fontWeight: 800, minWidth: "1.4em" }}>{number}.</span>
      <span>{children}</span>
    </div>
  );
}

function ConvertProblem({ problem, number }: { problem: Time2ConvertProblem; number: number }) {
  const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: "1.05rem", fontWeight: 600, whiteSpace: "nowrap" };
  return (
    <div>
      <Question number={number}>□ 안에 알맞은 수를 써넣으세요.</Question>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10, paddingLeft: "1.8em" }}>
        <div style={row}>
          <span style={{ color: "#666", width: "2em" }}>(1)</span>
          <span>{formatHoursMinutes(problem.toMinutes)} =</span>
          <AnswerBox width="3.4rem" />
          <span>분</span>
        </div>
        <div style={row}>
          <span style={{ color: "#666", width: "2em" }}>(2)</span>
          <span>{problem.toHours}분 =</span>
          <AnswerBox />
          <span>시간</span>
          <AnswerBox />
          <span>분</span>
        </div>
      </div>
    </div>
  );
}

function ScheduleProblem({ problem, number }: { problem: Time2ScheduleProblem; number: number }) {
  const cell: React.CSSProperties = { border: "1px solid #a1a1aa", padding: "3px 10px", textAlign: "center" };
  return (
    <div>
      <Question number={number}>{problem.text}</Question>
      <table style={{ borderCollapse: "collapse", margin: "8px 0 0 1.8em", fontSize: ".95rem", width: "calc(100% - 1.8em)" }}>
        <thead>
          <tr>
            <th colSpan={2} style={{ ...cell, background: "#f4f4f5", fontWeight: 700 }}>체험 시간표</th>
          </tr>
        </thead>
        <tbody>
          {problem.rows.map((row) => (
            <tr key={row.name}>
              <td style={cell}>{row.name}</td>
              <td style={cell}>
                {row.start !== undefined && row.end !== undefined
                  ? `${formatClockDigits(row.start)}~${formatClockDigits(row.end)}`
                  : `${row.duration}분`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AnswerLine unit="duration" />
    </div>
  );
}

function ClockProblem({ problem, number }: { problem: Time2ClockProblem; number: number }) {
  return (
    <div>
      <Question number={number}>{problem.text}</Question>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 8 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: ".9rem", fontWeight: 700, marginBottom: 2 }}>시작한 시각</div>
          <AnalogClock minuteOfDay={problem.start} size={96} label={`시작한 시각 ${formatClockKorean(problem.start)}`} />
        </div>
        <span style={{ fontSize: "1.4rem", color: "#71717a", marginTop: 18 }}>⇨</span>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: ".9rem", fontWeight: 700, marginBottom: 2 }}>끝난 시각</div>
          <AnalogClock minuteOfDay={problem.end} size={96} label={`끝난 시각 ${formatClockKorean(problem.end)}`} />
        </div>
      </div>
      <AnswerLine unit="duration" />
    </div>
  );
}

function EndProblem({ problem, number }: { problem: Time2EndProblem; number: number }) {
  return (
    <div>
      <Question number={number}>{problem.text}</Question>
      <AnswerLine unit="clock" />
    </div>
  );
}

function ProblemBlock({ problem, number }: { problem: Time2Problem; number: number }) {
  switch (problem.kind) {
    case "time2_convert":
      return <ConvertProblem problem={problem} number={number} />;
    case "time2_schedule":
      return <ScheduleProblem problem={problem} number={number} />;
    case "time2_clock":
      return <ClockProblem problem={problem} number={number} />;
    case "time2_end":
      return <EndProblem problem={problem} number={number} />;
  }
}

/**
 * 교재 활동지처럼 왼쪽 열을 위에서 아래로 채운 뒤 오른쪽 열로 넘어간다(1·2·3 | 4·5·6).
 * 두 열 사이에 세로줄을 두고, 문제 아래 남는 높이는 풀이 공간으로 고르게 나눈다.
 */
function Time2Sheet({ problems, count, sheetNum, totalSheets }: { problems: Time2Problem[]; count: number; sheetNum: number; totalSheets: number }) {
  const half = Math.ceil(problems.length / 2);
  const columns = [problems.slice(0, half), problems.slice(half)];
  return (
    <div className="sheet bg-white mx-auto flex flex-col" style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box", padding: "10mm 12mm", fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif", color: "#2f2f2f" }}>
      <div className="flex justify-between items-center text-sm mb-4 text-gray-500">
        <div className="flex" style={{ gap: 40 }}>
          <span>날짜: ___________</span>
          <span>이름: ___________</span>
        </div>
        <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {count}</span>
      </div>
      <div className="text-center" style={{ fontSize: "1.4rem", fontWeight: 900, borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 16 }}>
        걸린 시간 알아보기
        {totalSheets > 1 && <span className="text-sm font-normal text-gray-500 ml-2">({sheetNum}/{totalSheets})</span>}
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {columns.map((column, ci) => (
          <div
            key={ci}
            style={{
              display: "flex",
              flexDirection: "column",
              rowGap: 12,
              padding: ci === 0 ? "0 18px 0 0" : "0 0 0 18px",
              borderLeft: ci === 1 ? "1px solid #d4d4d8" : undefined,
            }}
          >
            {column.map((problem, i) => (
              // 문제마다 내용 높이를 먼저 확보하고 남는 높이(풀이 공간)만 고르게 나눈다.
              <div key={i} style={{ flex: "1 1 auto" }}>
                <ProblemBlock problem={problem} number={ci * half + i + 1} />
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
  const params = useMemo(() => parseTime2Params(searchParams), [searchParams]);
  const allSheets = useMemo(() => (params ? generateTime2AllSheets(params, queryString) : []), [params, queryString]);

  if (!params) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-sm">
          <p className="text-lg font-bold mb-4">잘못된 접근입니다</p>
          <Link href="/time2" className="text-blue-600 underline">돌아가기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100/80">
      <div className="print:hidden border-b bg-white">
        <div className="max-w-[880px] mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href="/time2"
            onClick={() => trackEvent(GA_EVENTS.NAV_BACK, { from: "time2_preview" })}
            className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold"
          >
            <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
            <span className="ml-1 transition-all duration-150 group-hover:font-bold">설정으로 돌아가기</span>
          </Link>

          <button
            onClick={() => {
              trackEvent(GA_EVENTS.PRINT, { page: "time2" });
              printAfterPaint();
            }}
            className="w-fit px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer"
          >
            <Printer className="w-4 h-4 inline mr-1" strokeWidth={1.5} />인쇄
          </button>
        </div>
      </div>

      {allSheets.map((problems, index) => (
        <div key={index} className={index < allSheets.length - 1 ? "break-after-page" : ""}>
          <Time2Sheet problems={problems} count={params.count} sheetNum={index + 1} totalSheets={params.sheets} />
        </div>
      ))}
    </div>
  );
}

export default function Time2PreviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">로딩 중...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
