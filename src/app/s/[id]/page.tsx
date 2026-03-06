"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer } from "lucide-react";
import { getWorksheet, type WorksheetRow, type WorksheetProblems, type WorksheetType } from "@/lib/supabase";
import { type MatchProblem, type CalcProblem, type Calc3Problem } from "@/lib/math-generator";

interface SharedProblemAny {
  top?: number[];
  a?: number;
  op1?: string;
}

function isMatchProblem(problem: unknown): problem is MatchProblem {
  if (!problem || typeof problem !== "object") return false;
  const item = problem as Record<string, unknown>;
  return Array.isArray(item.top) && Array.isArray(item.bottom) && typeof item.op === "number";
}

function isCalcProblem(problem: unknown): problem is CalcProblem {
  if (!problem || typeof problem !== "object") return false;
  const item = problem as Record<string, unknown>;
  return typeof item.a === "number" && typeof item.b === "number" && typeof item.answer === "number";
}

function isCalc3Problem(problem: unknown): problem is Calc3Problem {
  if (!problem || typeof problem !== "object") return false;
  const item = problem as Record<string, unknown>;
  return (
    typeof item.a === "number" &&
    typeof item.b === "number" &&
    typeof item.c === "number" &&
    typeof item.answer === "number" &&
    typeof item.op1 === "string" &&
    typeof item.op2 === "string"
  );
}

function detectSheetKind(wsType: WorksheetType, problems: unknown): "match" | "calc" | "calc3" {
  if (wsType === "add" || wsType === "sub") {
    return "match";
  }
  if (Array.isArray(problems) && problems.length > 0) {
    const firstSheet = problems[0];
    if (Array.isArray(firstSheet) && firstSheet.length > 0) {
      const first = firstSheet[0] as SharedProblemAny;
      if (first && isMatchProblem(first)) return "match";
      if (first && isCalc3Problem(first)) return "calc3";
      if (first && isCalcProblem(first)) return "calc";
    }
  }
  return "calc";
}

const TOP_COLORS = [
  { border: "#90caf9" },
  { border: "#a5d6a7" },
  { border: "#ffcc80" },
];
const BOT_COLORS = [
  { border: "#ef9a9a" },
  { border: "#ce93d8" },
  { border: "#80cbc4" },
];

function MatchSheet({ problems, title, sheetNum, totalSheets, problemCount, type }: { problems: MatchProblem[]; title: string; sheetNum: number; totalSheets: number; problemCount: number; type: "add" | "sub" }) {
  const instruction = type === "sub"
    ? "⭕의 수를 빼서 연산해요."
    : "⭕의 수를 더해서 연산해요.";

  return (
    <div className="bg-white max-w-[800px] mx-auto" style={{ padding: 32, fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="flex justify-between items-end mb-4 pb-2.5">
        <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>
          {title}
          {totalSheets > 1 && <span className="text-sm font-normal text-gray-400 ml-2">({sheetNum}/{totalSheets})</span>}
        </div>
        <div className="flex text-sm" style={{ gap: 120 }}>
          <span>날짜: </span>
          <span>이름: </span>
          <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {problemCount}</span>
        </div>
      </div>
      <div style={{ borderLeft: "4px solid #ff9800", padding: "8px 12px", borderRadius: "0 8px 8px 0", marginBottom: 24, fontSize: ".9rem", fontWeight: 700 }}>{instruction}</div>

      <div className="grid grid-cols-2 max-[600px]:grid-cols-1" style={{ gap: "16px 12px" }}>
        {problems.map((problem, index) => {
          const circleLabel = String(problem.op);
          return (
            <div
              key={`${sheetNum}-${index}-${circleLabel}`}
              className="relative flex items-center gap-[6px]"
              style={{ border: "2px solid #e0e0e0", borderRadius: 12, padding: "20px 16px" }}
            >
              <div className="absolute" style={{ top: -10, left: 12, background: "#ff9800", color: "#fff", fontSize: ".7rem", fontWeight: 700, padding: "2px 10px", borderRadius: 100 }}>
                {index + 1}
              </div>
              <div
                style={{ width: 57, height: 57, minWidth: 57, marginLeft: 8, borderRadius: "50%", border: "3px solid #e91e63", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 900, color: "#c2185b" }}
              >
                {circleLabel}
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-center" style={{ gap: 20 }}>
                  {problem.top.map((n, j) => (
                    <div key={j} className="flex flex-col items-center">
                      <div
                        style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: "1.1rem", fontWeight: 700, border: `2px solid ${TOP_COLORS[j].border}`, color: "#222", background: "#fff" }}
                      >
                        {n}
                      </div>
                      <div
                        style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", margin: "4px 0", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ padding: "14px 0" }} />
                <div className="flex justify-center" style={{ gap: 20 }}>
                  {problem.bottom.map((n, j) => (
                    <div key={j} className="flex flex-col items-center">
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", margin: "4px 0", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties} />
                      <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: "1.1rem", fontWeight: 700, border: `2px solid ${BOT_COLORS[j].border}`, color: "#222", background: "#fff" }}>{n}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function signByType(type: "add" | "sub" | "mul" | "div" | "add_sub" | "mul_div") {
  if (type === "add") return "+";
  if (type === "sub") return "−";
  if (type === "mul") return "×";
  return "÷";
}

function CalcSheet({
  problems,
  title,
  sheetNum,
  totalSheets,
  problemCount,
  type,
}: {
  problems: CalcProblem[];
  title: string;
  sheetNum: number;
  totalSheets: number;
  problemCount: number;
  type: "add" | "sub" | "mul" | "div" | "add_sub" | "mul_div";
}) {
  return (
    <div className="bg-white mx-auto" style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box", padding: "10mm 12mm", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="flex justify-between items-center text-sm mb-4 text-gray-400">
        <div className="flex" style={{ gap: 40 }}>
          <span>날짜: ___________</span>
          <span>이름: ___________</span>
        </div>
        <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {problemCount}</span>
      </div>
      <div className="mb-3 text-center" style={{ fontSize: "1.4rem", fontWeight: 900 }}>
        {title}
        {totalSheets > 1 && <span className="text-sm font-normal text-gray-400 ml-2">({sheetNum}/{totalSheets})</span>}
      </div>
      <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#555", borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 16 }}>연산해 보세요.</div>
      <div className="grid grid-cols-3" style={{ gap: "0 48px" }}>
        {problems.map((p, i) => (
          <div key={`${sheetNum}-${i}`} className="flex items-center h-full border-b border-gray-100 pb-2">
            <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold">{i + 1}</span>
            <span className="inline-flex items-center text-lg font-semibold whitespace-nowrap" style={{ marginLeft: "30px" }}>
              <span className="inline-grid items-center text-lg font-semibold" style={{ gridTemplateColumns: "2ch 22px 2ch 24px 56px", fontFamily: "'SFMono-Regular', 'Consolas', 'Menlo', 'Monaco', 'ui-monospace', 'Noto Sans KR', sans-serif", fontVariantNumeric: "tabular-nums" }}>
                <span className="justify-self-end">{p.a}</span>
                <span className="justify-self-center">{signByType(p.type === "add_sub" || p.type === "mul_div" ? (p.type === "add_sub" ? "add" : "mul") : p.type)}</span>
                <span className="justify-self-end">{p.b}</span>
                <span className="justify-self-center">=</span>
                <span className="inline-flex h-9 w-11 border-2 border-gray-700 rounded" />
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Calc3Sheet({
  problems,
  title,
  sheetNum,
  totalSheets,
  problemCount,
}: {
  problems: Calc3Problem[];
  title: string;
  sheetNum: number;
  totalSheets: number;
  problemCount: number;
}) {
  return (
    <div className="bg-white mx-auto" style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box", padding: "10mm 12mm", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="flex justify-between items-center text-sm mb-4 text-gray-400">
        <div className="flex" style={{ gap: 40 }}>
          <span>날짜: ___________</span>
          <span>이름: ___________</span>
        </div>
        <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {problemCount}</span>
      </div>
      <div className="mb-3 text-center" style={{ fontSize: "1.4rem", fontWeight: 900 }}>
        {title}
        {totalSheets > 1 && <span className="text-sm font-normal text-gray-400 ml-2">({sheetNum}/{totalSheets})</span>}
      </div>
      <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#555", borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 16 }}>연산해 보세요.</div>
      <div className="grid grid-cols-3" style={{ gap: "0 48px" }}>
        {problems.map((p, i) => (
          <div key={`${sheetNum}-${i}`} className="flex items-center h-full border-b border-gray-100 pb-2">
            <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold">{i + 1}</span>
            <span className="text-lg font-semibold tracking-wide" style={{ marginLeft: 24 }}>
              {p.a} {p.op1} {p.b} {p.op2} {p.c} =
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [ws, setWs] = useState<WorksheetRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getWorksheet(id).then((data) => {
      if (data) setWs(data);
      else setNotFound(true);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-500">로딩 중...</div>;

  if (notFound || !ws) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-bold mb-4">문제를 찾을 수 없습니다</p>
        <Link href="/" className="text-blue-600 underline">메인으로 돌아가기</Link>
      </div>
    );
  }

  const sheets = ws.problems as WorksheetProblems;
  const sheetKind = useMemo(() => detectSheetKind(ws.type, ws.problems), [ws.type, ws.problems]);
  const firstSheet = sheets[0] ?? [];

  const sheetMeta = { total: sheets.length, count: ws.problem_count };

  const typeLabel = ws.type === "sub"
    ? "빼기"
    : ws.type === "mul"
      ? "곱하기"
      : ws.type === "div"
        ? "나누기"
        : ws.type === "add_sub"
          ? "더하기/빼기"
          : ws.type === "mul_div"
            ? "곱하기/나누기"
            : "더하기";

  const title = (() => {
    if (sheetKind === "match") return `${typeLabel} ${ws.operands.join(", ")} 연습`;
    if (sheetKind === "calc3") return `${typeLabel} 연습 (3수)`;
    return `${typeLabel} 연습`;
  })();

  return (
    <div>
      <div className="print:hidden flex justify-center items-center gap-3 py-4 bg-white border-b">
        <Link href="/" className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300">← 새로 만들기</Link>
        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer"
        >
          <Printer className="w-4 h-4 inline mr-1" strokeWidth={1.5} />
          인쇄
        </button>
      </div>

      {sheets.map((sheet, i) => {
        const index = i + 1;
        if (sheetKind === "match") {
          return (
            <div key={`sheet-${index}`} className={i < sheets.length - 1 ? "break-after-page" : ""}>
              <MatchSheet
                problems={sheet as MatchProblem[]}
                title={title}
                sheetNum={index}
                totalSheets={sheetMeta.total}
                problemCount={sheetMeta.count}
                type={(ws.type === "sub" ? "sub" : "add") as "add" | "sub"}
              />
            </div>
          );
        }

        if (sheetKind === "calc3") {
          return (
            <div key={`sheet-${index}`} className={i < sheets.length - 1 ? "break-after-page" : ""}>
              <Calc3Sheet
                problems={sheet as Calc3Problem[]}
                title={title}
                sheetNum={index}
                totalSheets={sheetMeta.total}
                problemCount={sheetMeta.count}
              />
            </div>
          );
        }

        return (
          <div key={`sheet-${index}`} className={i < sheets.length - 1 ? "break-after-page" : ""}>
            <CalcSheet
              problems={sheet as CalcProblem[]}
              title={title}
              sheetNum={index}
              totalSheets={sheetMeta.total}
              problemCount={sheetMeta.count}
              type={firstSheet.length > 0 && isCalcProblem((sheet as CalcProblem[])[0]) ? (firstSheet[0] as CalcProblem).type : "add"}
            />
          </div>
        );
      })}
    </div>
  );
}
