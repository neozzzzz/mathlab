"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { saveWorksheet } from "@/lib/supabase";
import { Printer, Share2, Copy, Check } from "lucide-react";
import Link from "next/link";

interface CalcProblem {
  a: number;
  b: number;
  type: "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div";
  answer: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCalcSheet(params: {
  type: "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div";
  count: number;
  rangeMin: number;
  rangeMax: number;
  opMin: number;
  opMax: number;
}): CalcProblem[] {
  const problems: CalcProblem[] = [];
  const used = new Set<string>();
  let attempts = 0;

  while (problems.length < params.count && attempts < 1000) {
    attempts++;
    // 혼합 타입이면 랜덤으로 선택
    let op = params.type as string;
    if (op === "add_sub") op = Math.random() < 0.5 ? "add" : "sub";
    if (op === "mul_div") op = Math.random() < 0.5 ? "mul" : "div";

    let a: number, b: number, answer: number;
    if (op === "div") {
      // 나누기: b * q = a (나누어 떨어지도록)
      b = params.opMin + Math.floor(Math.random() * (params.opMax - params.opMin + 1));
      if (b === 0) continue;
      const qMin = Math.ceil(params.rangeMin / b);
      const qMax = Math.floor(params.rangeMax / b);
      if (qMin > qMax) continue;
      const q = qMin + Math.floor(Math.random() * (qMax - qMin + 1));
      a = b * q;
      answer = q;
    } else {
      a = params.rangeMin + Math.floor(Math.random() * (params.rangeMax - params.rangeMin + 1));
      b = params.opMin + Math.floor(Math.random() * (params.opMax - params.opMin + 1));
      if (op === "sub") answer = a - b;
      else if (op === "mul") answer = a * b;
      else answer = a + b;
    }
    if (answer < 0) continue;
    const key = `${op}-${a}-${b}`;
    if (used.has(key)) continue;
    used.add(key);
    problems.push({ a, b, type: op as CalcProblem["type"], answer });
  }

  return problems;
}

function CalcSheet({
  problems,
  title,
  sheetNum,
  totalSheets,
  type,
}: {
  problems: CalcProblem[];
  title: string;
  sheetNum: number;
  totalSheets: number;
  type: "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div";
}) {
  const signMap = { add: "+", sub: "−", mul: "×", div: "÷", add_sub: "+", mul_div: "×" } as const;
  const cols = 3;
  const rows = Math.ceil(problems.length / cols);
  // A4(210x297mm) 한 장 기준으로 그리드 영역을 고정하고, 행 수에 따라 균등 분배한다.
  const PAGE_HEIGHT_MM = 297;
  const PAGE_PADDING_Y_MM = 20; // 상하 패딩 10mm + 10mm
  const HEADER_BLOCK_MM = 16;
  const INSTRUCTION_BLOCK_MM = 18;
  const gridHeightMm = Math.max(
    120,
    PAGE_HEIGHT_MM - PAGE_PADDING_Y_MM - HEADER_BLOCK_MM - INSTRUCTION_BLOCK_MM
  );

  // 세로 방향으로 번호 매기기 (1열: 1~8, 2열: 9~16, 3열: 17~24)
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
    <div
      className="bg-white mx-auto"
      style={{
        width: "210mm",
        minHeight: "297mm",
        boxSizing: "border-box",
        padding: "10mm 12mm",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      {/* 헤더 */}
      <div className="flex justify-between items-end mb-4 pb-2.5">
        <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>
          {title}
          {totalSheets > 1 && (
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({sheetNum}/{totalSheets})
            </span>
          )}
        </div>
        <div className="flex text-sm" style={{ gap: 120 }}>
          <span>날짜: </span>
          <span>이름: </span>
          <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {problems.length}</span>
        </div>
      </div>

      {/* 지시문 */}
      <div
        style={{
          borderLeft: "4px solid #ff9800",
          padding: "8px 12px",
          borderRadius: "0 8px 8px 0",
          marginBottom: 28,
          fontSize: ".9rem",
          fontWeight: 700,
        }}
      >
        계산해 보세요.
      </div>

      {/* 문제 그리드 */}
      <div
        className="grid grid-cols-3 gap-x-12"
        style={{
          gap: "0 48px",
          height: `${gridHeightMm}mm`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((row, r) => (
          row.map((p, c) => {
            if (!p) return <div key={`${r}-${c}`} />;
            const num = c * rows + r + 1;
            return (
              <div
                key={`${r}-${c}`}
                className="flex items-center h-full"
                style={{ borderBottom: "1px solid #f0f0f0" }}
              >
                <span className="shrink-0 mr-4 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-bold">
                  {num}
                </span>
                <span className="text-lg font-semibold tracking-wide">
                  {p.a} {p.type === "sub" ? "−" : p.type === "mul" ? "×" : p.type === "div" ? "÷" : "+"} {p.b} =
                </span>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}

function CalcPreviewContent() {
  const searchParams = useSearchParams();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const params = useMemo(() => {
    const t = searchParams.get("t") as "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div";
    const c = Number(searchParams.get("c"));
    const s = Number(searchParams.get("s"));
    const mn = Number(searchParams.get("mn"));
    const mx = Number(searchParams.get("mx"));
    const omn = Number(searchParams.get("omn"));
    const omx = Number(searchParams.get("omx"));
    if (!t || !c || !s || !mn || !mx || !omn || !omx) return null;
    return { type: t, count: c, sheets: s, rangeMin: mn, rangeMax: mx, opMin: omn, opMax: omx };
  }, [searchParams]);

  const [allSheets, setAllSheets] = useState<CalcProblem[][]>([]);
  
  useEffect(() => {
    if (!params || allSheets.length > 0) return;
    setAllSheets(Array.from({ length: params.sheets }, () => generateCalcSheet(params)));
  }, [params]);

  if (!params) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-bold mb-4">잘못된 접근입니다</p>
        <Link href="/calc" className="text-blue-600 underline">돌아가기</Link>
      </div>
    );
  }

  const typeLabelMap: Record<string, string> = { add: "더하기", sub: "빼기", add_sub: "더하기·빼기 혼합", mul: "곱하기", div: "나누기", mul_div: "곱하기·나누기 혼합" };
  const typeLabel = typeLabelMap[params.type] || "연산";
  const title = `${typeLabel} 연습`;

  async function handleShare() {
    if (shareUrl || saving) return;
    setSaving(true);
    const result = await saveWorksheet({
      title,
      type: params!.type,
      operands: [params!.opMin, params!.opMax],
      rangeMin: params!.rangeMin,
      rangeMax: params!.rangeMax,
      problemCount: params!.count,
      problems: allSheets,
    });
    setSaving(false);
    if ("shortCode" in result) {
      const url = `${window.location.origin}/s/${result.shortCode}`;
      setShareUrl(url);
    } else {
      alert("저장 실패: " + result.error);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="print:hidden max-w-[800px] mx-auto px-8 pt-6">
        <Link href="/calc" className="inline-block mb-4 text-sm text-gray-400 hover:text-gray-600">← 돌아가기</Link>
      </div>
      <div className="print:hidden flex justify-center items-center gap-3 py-4 bg-white border-b flex-wrap">
        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer"
        >
          <Printer className="w-4 h-4 inline mr-1" strokeWidth={1.5} />인쇄
        </button>
        {!shareUrl ? (
          <button
            onClick={handleShare}
            disabled={saving}
            className="px-5 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer disabled:opacity-50"
          >
            {saving ? "저장 중..." : <><Share2 className="w-4 h-4 inline mr-1" strokeWidth={1.5} />공유 링크 생성</>}
          </button>
        ) : (
          <button
            onClick={handleCopy}
            className="px-5 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer"
          >
            {copied ? <><Check className="w-4 h-4 inline mr-1" strokeWidth={1.5} />복사됨</> : <><Copy className="w-4 h-4 inline mr-1" strokeWidth={1.5} />링크 복사</>}
          </button>
        )}
      </div>
      {shareUrl && (
        <div className="print:hidden text-center py-2 bg-green-50 border-b border-green-200">
          <span className="text-sm text-green-800">공유 링크: </span>
          <a href={shareUrl} className="text-sm text-green-700 font-bold underline" target="_blank">{shareUrl}</a>
        </div>
      )}

      {allSheets.map((problems, i) => (
        <div key={i} className={i < allSheets.length - 1 ? "break-after-page" : ""}>
          <CalcSheet
            problems={problems}
            title={title}
            sheetNum={i + 1}
            totalSheets={params.sheets}
            type={params.type}
          />
        </div>
      ))}
    </div>
  );
}

export default function CalcPreviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">로딩 중...</div>}>
      <CalcPreviewContent />
    </Suspense>
  );
}
