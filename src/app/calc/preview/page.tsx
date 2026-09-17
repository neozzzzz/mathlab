"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Printer, Share2, Copy, Check } from "lucide-react";
import {
  generateCalcAllSheets,
  parseCalcParams,
  type CalcProblem,
  type ScreenshotAdditionProblem,
  generateScreenshotAdditionAllSheets,
  parseScreenshotAdditionParams,
} from "@/lib/math-generator";
import { saveWorksheet } from "@/lib/supabase";
import { trackEvent, GA_EVENTS } from "@/lib/ga";

import { BoxCell, NumberBox, NumberBoxRowCells, splitToCells } from "@/components/math/BoxCell";

function CalcSheet({
  problems,
  title,
  count,
  sheetNum,
  totalSheets,
  type,
}: {
  problems: CalcProblem[];
  title: string;
  count: number;
  sheetNum: number;
  totalSheets: number;
  type: "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div" | "mixed_addition";
}) {
  const operatorByType: Record<string, string> = {
    add: "+",
    sub: "−",
    add_sub: "+",
    mul: "×",
    div: "÷",
    mul_div: "×",
    mixed_addition: "+",
  };
  const cols = 3;
  const rows = Math.ceil(problems.length / cols);
  const PAGE_HEIGHT_MM = 297;
  const PAGE_PADDING_Y_MM = 20;
  const HEADER_BLOCK_MM = 16;
  const INSTRUCTION_BLOCK_MM = 18;
  const gridHeightMm = Math.max(120, PAGE_HEIGHT_MM - PAGE_PADDING_Y_MM - HEADER_BLOCK_MM - INSTRUCTION_BLOCK_MM);

  const grid: (CalcProblem | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: (CalcProblem | null)[] = [];
    for (let c = 0; c < cols; c++) {
      const idx = c * rows + r;
      row.push(idx < problems.length ? problems[idx] : null);
    }
    grid.push(row);
  }

  return (
    <div className="sheet bg-white mx-auto" style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box", padding: "10mm 12mm" }}>
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
      <div className="pb-3 mb-4 border-b border-gray-300" style={{ fontSize: ".9rem", fontWeight: 700, color: "#555" }}>
        연산해 보세요.
      </div>
      <div
        className="grid grid-cols-3 gap-x-12"
        style={{
          gap: "0 48px",
          height: `${gridHeightMm}mm`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((row, r) =>
          row.map((p, c) => {
            if (!p) return <div key={`${r}-${c}`} />;
            const num = c * rows + r + 1;
            return (
              <div
                key={`${r}-${c}`}
                className="flex items-center h-full"
                style={{ borderBottom: "1px solid #f0f0f0" }}
              >
                <span className="shrink-0 mr-4 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold">
                  {num}
                </span>
                <span className="text-lg font-semibold tracking-wide">
                  {p.a} {operatorByType[p.type]} {p.b} =
                </span>
              </div>
            );
          })
        )}
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

      <div style={{ paddingTop: 2, fontSize: "1.2rem", color: "#2f2f2f" }}>
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


function useGeneratedSheets(mode: "calc" | "screenshot_addition") {
  const searchParams = useSearchParams();
  const modeAwareParams = useMemo(() => {
    if (mode === "screenshot_addition") return parseScreenshotAdditionParams(searchParams);
    return parseCalcParams(searchParams);
  }, [mode, searchParams]);

  return modeAwareParams;
}

function isModeScreenshot(params: unknown): params is ReturnType<typeof parseScreenshotAdditionParams> {
  return params != null && typeof params === "object" && (params as { mode?: string }).mode === "screenshot_addition";
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "screenshot_addition" ? "screenshot_addition" : "calc";
  const params = useGeneratedSheets(mode);

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [allSheets, setAllSheets] = useState<CalcProblem[][] | ScreenshotAdditionProblem[][]>([]);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => {
    if (!params) return;
    if (mode === "screenshot_addition") {
      setAllSheets(generateScreenshotAdditionAllSheets(params as ReturnType<typeof parseScreenshotAdditionParams> as never, searchParams.toString()));
      return;
    }

    setAllSheets(generateCalcAllSheets(params as ReturnType<typeof parseCalcParams> as never, searchParams.toString()));
  }, [params, mode, searchParams]);

  useEffect(() => () => {
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  if (!params) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-bold mb-4">잘못된 접근입니다</p>
        <Link href="/calc" className="text-blue-600 underline">돌아가기</Link>
      </div>
    );
  }

  const safeParams = params as Exclude<NonNullable<typeof params>, null>;

  const isScreenshot = mode === "screenshot_addition" && isModeScreenshot(safeParams);
  const calcParams = isScreenshot ? null : (safeParams as ReturnType<typeof parseCalcParams>);
  const title = isScreenshot
    ? "고급 사칙연산"
    : (() => {
        if (!calcParams) return "연산 연습";
        const map: Record<string, string> = {
          add: "더하기 연습",
          sub: "빼기 연습",
          add_sub: "더하기/빼기 연습",
          mul: "곱하기 연습",
          div: "나누기 연습",
          mul_div: "곱하기/나누기 연습",
          mixed_addition: "세로셈 연습",
        };
        return `${map[calcParams.type]} `;
      })();

  const expectedCount = safeParams.count * safeParams.sheets;
  const generatedCount = allSheets.reduce((acc, problems) => acc + problems.length, 0);

  async function handleShare() {
    if (allSheets.length === 0) {
      showToast("문제가 생성되지 않았습니다. 다시 생성 후 시도해 주세요.");
      return;
    }

    if (shareUrl || saving) return;
    trackEvent(GA_EVENTS.SHARE_CREATE, { page: "calc", mode: isScreenshot ? "screenshot_addition" : "calc" });
    try {
      setSaving(true);
      const savePayload = isScreenshot && isModeScreenshot(safeParams)
        ? {
            type: "screenshot_addition" as const,
            operands: [safeParams.firstMin, safeParams.firstMax, safeParams.secondMin, safeParams.secondMax],
            rangeMin: safeParams.firstMin,
            rangeMax: safeParams.firstMax,
          }
        : (() => {
            const calcParams = params as Exclude<ReturnType<typeof parseCalcParams>, null>;
            return {
              type: calcParams.type,
              operands: [calcParams.opMin, calcParams.opMax] as number[],
              rangeMin: calcParams.rangeMin,
              rangeMax: calcParams.rangeMax,
            };
          })();

      const { type, operands, rangeMin, rangeMax } = savePayload;

      const result = await saveWorksheet({
        title,
        type,
        operands,
        rangeMin,
        rangeMax,
        problemCount: safeParams.count,
        problems: allSheets,
      });
      if ("shortCode" in result) {
        const url = `${window.location.origin}/s/${result.shortCode}`;
        setShareUrl(url);
      } else {
        const err = result.error;
        if (err.toLowerCase().includes("failed to fetch") || err.toLowerCase().includes("fetch")) {
          showToast("저장 실패: 네트워크 연결에 문제가 있어 공유 링크를 생성할 수 없어요.");
        } else {
          showToast("저장 실패: " + err);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      if (message.includes("Failed to fetch") || message.includes("fetch")) {
        showToast("공유 링크 생성에 실패했어요: 네트워크 연결/DB 접속을 확인해 주세요.");
      } else {
        showToast(`공유 링크 생성 중 오류가 발생했습니다: ${message}`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    trackEvent(GA_EVENTS.SHARE_COPY, { page: "calc" });
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("클립보드 복사에 실패했습니다");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100/80">
      {toast && (
        <div className="print:hidden fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-bold animate-fade-in">
          {toast}
        </div>
      )}
      <div className="print:hidden border-b bg-white">
        <div className="max-w-[880px] mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link href="/calc" onClick={() => trackEvent(GA_EVENTS.NAV_BACK, { from: "calc" })} className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold">
            <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
            <span className="ml-1 transition-all duration-150 group-hover:font-bold">문제 생성으로 돌아가기</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                trackEvent(GA_EVENTS.PRINT, { page: "calc" });
                window.print();
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer"
            >
              <Printer className="w-4 h-4 inline mr-1" strokeWidth={1.5} />인쇄
            </button>
            {!shareUrl ? (
              <button
                onClick={handleShare}
                disabled={saving}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer disabled:opacity-50"
              >
                {saving ? "저장 중..." : <><Share2 className="w-4 h-4 inline mr-1" strokeWidth={1.5} />공유 링크 생성</>}
              </button>
            ) : (
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer"
              >
                {copied ? <><Check className="w-4 h-4 inline mr-1" strokeWidth={1.5} />복사됨</> : <><Copy className="w-4 h-4 inline mr-1" strokeWidth={1.5} />링크 복사</>}
              </button>
            )}
          </div>
        </div>
      </div>
      {shareUrl && (
        <div className="print:hidden text-center py-2 px-4 md:px-6 bg-green-50 border-b border-green-200">
          <span className="text-sm text-green-800">공유 링크: </span>
          <a href={shareUrl} className="text-sm text-green-700 font-bold underline" target="_blank" rel="noopener noreferrer">{shareUrl}</a>
        </div>
      )}

      {(allSheets.length > 0 && generatedCount !== expectedCount) ? (
        <div className="max-w-[800px] mx-auto px-4 py-3 bg-amber-50 border border-amber-300 rounded-lg mb-3 text-amber-900 text-sm">
          <p className="font-bold mb-2">요청 문항을 모두 만들지 못했습니다.</p>
          <p>
            목표: <span className="font-bold">{expectedCount}문제</span> · 생성됨: <span className="font-bold">{generatedCount}문제</span>
          </p>
        </div>
      ) : null}

      {allSheets.map((problems, i) => (
        <div key={i} className={i < allSheets.length - 1 ? "break-after-page" : ""}>
          {isScreenshot && "firstMin" in (safeParams as Exclude<ReturnType<typeof parseScreenshotAdditionParams>, null>) ? (
            <ScreenshotAdditionSheet
              problems={problems as ScreenshotAdditionProblem[]}
              title={title}
              count={safeParams.count}
              sheetNum={i + 1}
              totalSheets={safeParams.sheets}
            />
          ) : (safeParams as Exclude<ReturnType<typeof parseCalcParams>, null>).type === "mixed_addition" ? (
            <MixedAdditionSheet
              problems={problems as CalcProblem[]}
              title={title}
              count={safeParams.count}
              sheetNum={i + 1}
              totalSheets={safeParams.sheets}
            />
          ) : (
            <CalcSheet
              problems={problems as CalcProblem[]}
              title={title}
              count={safeParams.count}
              sheetNum={i + 1}
              totalSheets={safeParams.sheets}
              type={(safeParams as Exclude<ReturnType<typeof parseCalcParams>, null>).type}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">로딩 중...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
