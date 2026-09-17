"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer } from "lucide-react";
import { getWorksheet, type WorksheetRow, type WorksheetProblems, type WorksheetType } from "@/lib/supabase";
import { type MatchProblem, type CalcProblem, type Calc3Problem, type ScreenshotAdditionProblem } from "@/lib/math-generator";

import { BoxCell, NumberBox, NumberBoxRowCells, splitToCells } from "@/components/math/BoxCell";

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

function isScreenshotAdditionProblem(problem: unknown): problem is ScreenshotAdditionProblem {
  if (!problem || typeof problem !== "object") return false;
  const item = problem as Record<string, unknown>;
  return (
    item.kind === "screenshot_addition" &&
    typeof item.a === "number" &&
    typeof item.b === "number" &&
    typeof item.leftRoundedA === "number" &&
    typeof item.leftCorrection === "number" &&
    typeof item.leftIntermediate === "number" &&
    typeof item.rightRoundedB === "number" &&
    typeof item.rightCorrection === "number" &&
    typeof item.rightIntermediate === "number" &&
    typeof item.answer === "number"
  );
}

function detectSheetKind(wsType: WorksheetType, problems: unknown): "match" | "calc" | "calc3" | "screenshot" {
  if (wsType === "add" || wsType === "sub") {
    return "match";
  }
  if (wsType === "screenshot_addition") {
    return "screenshot";
  }
  if (Array.isArray(problems) && problems.length > 0) {
    const firstSheet = problems[0];
    if (Array.isArray(firstSheet) && firstSheet.length > 0) {
      const first = firstSheet[0] as SharedProblemAny;
      if (first && isMatchProblem(first)) return "match";
      if (first && isScreenshotAdditionProblem(first)) return "screenshot";
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

function signByType(type: "add" | "sub" | "mul" | "div" | "add_sub" | "mul_div" | "mixed_addition") {
  if (type === "add") return "+";
  if (type === "sub") return "−";
  if (type === "mul") return "×";
  if (type === "mixed_addition") return "+";
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
  type: "add" | "sub" | "mul" | "div" | "add_sub" | "mul_div" | "mixed_addition";
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
  const rowStyle: React.CSSProperties = {
    display: "inline-grid",
    gridTemplateColumns: "1.8ch 2.2ch 2.2ch 2.2ch",
    alignItems: "end",
    rowGap: 4,
    columnGap: 0,
    fontFamily: "'SFMono-Regular', 'Consolas', 'Menlo', 'Monaco', 'ui-monospace', 'Noto Sans KR', sans-serif",
    fontVariantNumeric: "tabular-nums",
    fontSize: "1.35rem",
    fontWeight: 700,
    lineHeight: 1,
  };

  return (
    <div className="sheet bg-white mx-auto" style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box", padding: "10mm 12mm", fontFamily: "'Noto Sans KR', sans-serif" }}>
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
      <div className="grid gap-10" style={{
        paddingTop: 2,
        fontSize: "1.2rem",
        color: "#2f2f2f",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        rowGap: 16,
        columnGap: 24,
      }}>
        {problems.map((p, i) => (
          <div key={`${sheetNum}-${i}`} className="flex items-start gap-3 min-w-0">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold mt-1 shrink-0">
              {i + 1}
            </span>
            <div style={rowStyle}>
              <NumberBox
                tone="number"
                width="1.8ch"
                align="center"
                className="text-transparent"
                style={{
                  gridRow: 1,
                  gridColumn: "1 / span 4",
                  borderColor: "#d2d2d2",
                  backgroundColor: "#fff",
                }}
              >
                &nbsp;
              </NumberBox>

              <NumberBoxRowCells
                value={p.a}
                cellCount={3}
                width="2.2ch"
                tone="number"
                style={{
                  gridRow: 1,
                  gridColumn: "2 / span 3",
                  height: "2.2rem",
                  lineHeight: 1,
                  paddingTop: 0,
                  paddingBottom: 0,
                  zIndex: 3,
                }}
              />

              <span
                aria-hidden="true"
                style={{
                  gridRow: 2,
                  gridColumn: "1",
                  width: "1.8ch",
                  height: "2.2rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.35rem",
                  lineHeight: 1,
                }}
              >
                {p.op1}
              </span>

              <NumberBoxRowCells
                value={p.b}
                cellCount={3}
                width="2.2ch"
                tone="number"
                style={{
                  gridRow: 2,
                  gridColumn: "2 / span 3",
                  height: "2.2rem",
                  lineHeight: 1,
                  paddingTop: 0,
                  paddingBottom: 0,
                  zIndex: 3,
                }}
              />

              <span
                style={{
                  gridRow: 3,
                  gridColumn: "1 / span 4",
                  display: "inline-block",
                  borderBottom: "2px solid #222",
                  width: "100%",
                  marginLeft: 0,
                }}
              />

              <NumberBox
                tone="answer"
                width="6.9ch"
                align="right"
                style={{
                  gridRow: 4,
                  gridColumn: "2 / span 3",
                  height: "2.2rem",
                  backgroundColor: "#fff",
                  zIndex: 3,
                }}
              />

              <span
                aria-hidden="true"
                style={{
                  gridRow: 5,
                  gridColumn: "1",
                  width: "1.8ch",
                  height: "2.2rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.35rem",
                  lineHeight: 1,
                  marginTop: 4,
                }}
              >
                {p.op2}
              </span>

              <NumberBoxRowCells
                value={p.c}
                cellCount={3}
                width="2.2ch"
                tone="number"
                style={{
                  gridRow: 5,
                  gridColumn: "2 / span 3",
                  height: "2.2rem",
                  lineHeight: 1,
                  paddingTop: 0,
                  paddingBottom: 0,
                  marginTop: 4,
                  zIndex: 3,
                }}
              />

              <span
                style={{
                  gridRow: 6,
                  gridColumn: "1 / span 4",
                  display: "inline-block",
                  borderBottom: "2px solid #222",
                  width: "100%",
                  marginTop: 4,
                }}
              />

              <NumberBox
                tone="answer"
                width="6.9ch"
                align="right"
                style={{
                  gridRow: 7,
                  gridColumn: "2 / span 3",
                  height: "2.2rem",
                  backgroundColor: "#fff",
                  zIndex: 3,
                  marginTop: 4,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function MixedAdditionSheet({
  problems,
  title,
  count,
  sheetNum,
  totalSheets,
}: {
  problems: CalcProblem[];
  title: string;
  count: number;
  sheetNum: number;
  totalSheets: number;
}) {
  const rowStyle: React.CSSProperties = {
    display: "inline-grid",
    gridTemplateColumns: "12px 2.2ch 2.2ch",
    alignItems: "end",
    rowGap: 4,
    columnGap: 0,
    fontFamily: "'SFMono-Regular', 'Consolas', 'Menlo', 'Monaco', 'ui-monospace', 'Noto Sans KR', sans-serif",
    fontVariantNumeric: "tabular-nums",
    fontSize: "1.35rem",
    fontWeight: 700,
    lineHeight: 1,
  };

  const digitCellStyle: React.CSSProperties = {
    height: "2rem",
    lineHeight: 1,
    paddingTop: 0,
    paddingBottom: 0,
    zIndex: 3,
  };

  const verticalGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    rowGap: 16,
    columnGap: 24,
  };

  return (
    <div className="sheet bg-white mx-auto" style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box", padding: "10mm 12mm", fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif" }}>
      <div className="flex justify-between items-center text-sm mb-4 text-gray-400">
        <div className="flex" style={{ gap: 40 }}>
          <span>날짜: ___________</span>
          <span>이름: ___________</span>
        </div>
        <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {count}</span>
      </div>
      <div className="mb-3 text-center" style={{ fontSize: "1.4rem", fontWeight: 900 }}>
        {title}
        {totalSheets > 1 && <span className="text-sm font-normal text-gray-400 ml-2">({sheetNum}/{totalSheets})</span>}
      </div>
      <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#555", borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 16 }}>연산해 보세요.</div>

      <div className="grid gap-10" style={{ paddingTop: 2, fontSize: "1.2rem", color: "#2f2f2f" }}>
        <div style={verticalGridStyle}>
          {problems.map((p, i) => {
            const number = i + 1;
            const topDigits = splitToCells(p.a, 2);
            const bottomDigits = splitToCells(p.b, 2);

            return (
              <div key={`v-${p.a}-${p.b}-${i}`} className="flex items-start gap-3 min-w-0">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold mt-1 shrink-0">{number}</span>
                <div className="min-w-0">
                  <div style={rowStyle}>
                    {topDigits.map((digit, idx) => (
                      <BoxCell key={`top-${p.a}-${p.b}-${i}-${idx}`} tone="number" width="2.2ch" align="center" style={{ ...digitCellStyle, gridRow: 1, gridColumn: 2 + idx }}>
                        {digit === " " ? "\u00A0" : digit}
                      </BoxCell>
                    ))}
                    <span style={{ gridRow: 2, gridColumn: 1, textAlign: "center" }}>+</span>
                    {bottomDigits.map((digit, idx) => (
                      <BoxCell key={`bottom-${p.a}-${p.b}-${i}-${idx}`} tone="number" width="2.2ch" align="center" style={{ ...digitCellStyle, gridRow: 2, gridColumn: 2 + idx }}>
                        {digit === " " ? "\u00A0" : digit}
                      </BoxCell>
                    ))}
                    <span style={{ gridRow: 3, gridColumn: "1 / 4", display: "inline-block", borderBottom: "2px solid #222", width: "100%" }} />
                  </div>
                  <div style={{ marginTop: 6, marginLeft: 12 }}>
                    <NumberBox tone="answer" width="4.4ch" height="2.2rem" align="right" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScreenshotAdditionSheet({
  problems,
  title,
  count,
  sheetNum,
  totalSheets,
}: {
  problems: ScreenshotAdditionProblem[];
  title: string;
  count: number;
  sheetNum: number;
  totalSheets: number;
}) {
  const cols = 1;
  const rows = Math.ceil(problems.length / cols);
  const PAGE_HEIGHT_MM = 297;
  const PAGE_PADDING_Y_MM = 20;
  const HEADER_BLOCK_MM = 16;
  const INSTRUCTION_BLOCK_MM = 22;
  const TOP_OFFSET_MM = 4;
  const gridHeightMm = Math.max(140, PAGE_HEIGHT_MM - PAGE_PADDING_Y_MM - HEADER_BLOCK_MM - INSTRUCTION_BLOCK_MM - TOP_OFFSET_MM);

  const grid: (ScreenshotAdditionProblem | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: (ScreenshotAdditionProblem | null)[] = [];
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      row.push(idx < problems.length ? problems[idx] : null);
    }
    grid.push(row);
  }

  const blankBox = (answer: number, key: string) => (
    <span
      key={key}
      data-answer={answer}
      className="inline-flex h-8 min-w-[34px] items-center justify-center rounded-md border border-[#b9b9b9] bg-white px-2 align-middle"
    >
      &nbsp;
    </span>
  );

  return (
    <div className="sheet bg-white mx-auto" style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box", padding: "10mm 12mm", fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif" }}>
      <div className="flex justify-between items-center text-sm mb-4 text-gray-400">
        <div className="flex" style={{ gap: 40 }}>
          <span>날짜: ___________</span>
          <span>이름: ___________</span>
        </div>
        <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {count}</span>
      </div>
      <div className="mb-3 text-center" style={{ fontSize: "1.4rem", fontWeight: 900 }}>
        {title}
        {totalSheets > 1 && <span className="text-sm font-normal text-gray-400 ml-2">({sheetNum}/{totalSheets})</span>}
      </div>
      <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#555", borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 16 }}>연산해 보세요.</div>

      <div
        className="grid gap-10"
        style={{
          paddingTop: `${TOP_OFFSET_MM}mm`,
          fontSize: "1.2rem",
          color: "#2f2f2f",
          height: `${gridHeightMm}mm`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(1, minmax(0, 1fr))", rowGap: 16, columnGap: 24 }}>
          {grid.map((row, r) =>
            row.map((p, c) => {
              if (!p) return <div key={`s-empty-${r}-${c}`} />;
              const number = r * cols + c + 1;
              return (
                <div key={`s-${p.a}-${p.b}-${number}`} className="flex items-start h-full min-w-0">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold mt-1 shrink-0">{number}</span>
                  <div className="flex-1 min-w-0 text-[#2f2f2f]" style={{ marginLeft: 24 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", columnGap: 18 }}>
                      <div style={{ paddingRight: 14, borderRight: "1px dotted #c7c7c7" }}>
                        <div className="leading-8 whitespace-nowrap text-[15px] text-slate-600">
                          <span className="font-semibold text-slate-900">{p.a} + {p.b}</span>
                          <span> = </span>
                          <span className="font-medium text-slate-900">{p.leftRoundedA}</span>
                          <span> + </span>
                          {blankBox(p.leftCorrection, `left-correction-${number}`)}
                          <span> + </span>
                          <span>{p.b}</span>
                        </div>
                        <div className="leading-8 whitespace-nowrap text-[15px] text-slate-600">
                          <span>= </span>
                          <span className="font-medium text-slate-900">{p.leftRoundedA}</span>
                          <span> + </span>
                          {blankBox(p.leftIntermediate, `left-intermediate-${number}`)}
                        </div>
                        <div className="leading-8 whitespace-nowrap text-[15px] text-slate-600">
                          <span>= </span>
                          {blankBox(p.answer, `left-answer-${number}`)}
                        </div>
                      </div>

                      <div style={{ paddingLeft: 2 }}>
                        <div className="leading-8 whitespace-nowrap text-[15px] text-slate-600">
                          <span className="font-semibold text-slate-900">{p.a} + {p.b}</span>
                          <span> = </span>
                          <span>{p.a}</span>
                          <span> + </span>
                          <span className="inline-flex rounded-full bg-[#ededed] px-3 py-1 align-middle leading-none">{p.rightRoundedB}</span>
                          <span> - </span>
                          {blankBox(p.rightCorrection, `right-correction-top-${number}`)}
                        </div>
                        <div className="leading-8 whitespace-nowrap text-[15px] text-slate-600">
                          <span>= </span>
                          <span className="font-medium text-slate-900">{p.rightIntermediate}</span>
                          <span> - </span>
                          {blankBox(p.rightCorrection, `right-correction-mid-${number}`)}
                        </div>
                        <div className="leading-8 whitespace-nowrap text-[15px] text-slate-600">
                          <span>= </span>
                          {blankBox(p.answer, `right-answer-${number}`)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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

  const typeLabel =
    ws.type === "sub"
      ? "빼기"
      : ws.type === "mul"
        ? "곱하기"
        : ws.type === "div"
          ? "나누기"
          : ws.type === "add_sub"
            ? "더하기/빼기"
            : ws.type === "mul_div"
              ? "곱하기/나누기"
              : ws.type === "mixed_addition"
                ? "세로셈"
                : ws.type === "screenshot_addition"
                  ? "고급 사칙연산"
                  : "더하기";

  const title = (() => {
    if (sheetKind === "match") return `${typeLabel} ${ws.operands.join(", ")} 연습`;
    if (sheetKind === "calc3") return `${typeLabel} 연습 (3수)`;
    if (sheetKind === "screenshot") return `${typeLabel}`;
    return `${typeLabel} 연습`;
  })();

  return (
    <div className="min-h-[100dvh] bg-slate-100/80">
      <div className="print:hidden border-b bg-white">
        <div className="max-w-[880px] mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link href="/calc" className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold">
            <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
            <span className="ml-1 transition-all duration-150 group-hover:font-bold">문제 생성으로 돌아가기</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer"
            >
              <Printer className="w-4 h-4 inline mr-1" strokeWidth={1.5} />인쇄
            </button>
          </div>
        </div>
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

        if (sheetKind === "screenshot") {
          return (
            <div key={`sheet-${index}`} className={i < sheets.length - 1 ? "break-after-page" : ""}>
              <ScreenshotAdditionSheet
                problems={sheet as ScreenshotAdditionProblem[]}
                title={title}
                count={sheetMeta.count}
                sheetNum={index}
                totalSheets={sheetMeta.total}
              />
            </div>
          );
        }

        const sheetProblems = sheet as CalcProblem[];
        const sheetType = sheetProblems.length > 0 && isCalcProblem(sheetProblems[0])
          ? sheetProblems[0].type ?? "add"
          : "add";

        const isMixedAdditionSheet = ws.type === "mixed_addition" || sheetType === "mixed_addition";

        if (isMixedAdditionSheet) {
          return (
            <div key={`sheet-${index}`} className={i < sheets.length - 1 ? "break-after-page" : ""}>
              <MixedAdditionSheet
                problems={sheetProblems}
                title={title}
                count={sheetMeta.count}
                sheetNum={index}
                totalSheets={sheetMeta.total}
              />
            </div>
          );
        }

        return (
          <div key={`sheet-${index}`} className={i < sheets.length - 1 ? "break-after-page" : ""}>
            <CalcSheet
              problems={sheetProblems}
              title={title}
              sheetNum={index}
              totalSheets={sheetMeta.total}
              problemCount={sheetMeta.count}
              type={sheetType}
            />
          </div>
        );
      })}
    </div>
  );
}
