"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { saveWorksheet } from "@/lib/supabase";
import { Printer, Share2, Copy, Check } from "lucide-react";
import Link from "next/link";

type OpType3 = "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div";

interface Calc3Problem {
  a: number;
  b: number;
  c: number;
  op1: string; // "+", "−", "×", "÷"
  op2: string;
  answer: number;
}

function pickOp(type: OpType3): [string, string] {
  const addSub = () => (Math.random() < 0.5 ? "+" : "−");
  const mulDiv = () => (Math.random() < 0.5 ? "×" : "÷");
  switch (type) {
    case "add":
      return ["+", "+"];
    case "sub":
      return ["−", "−"];
    case "add_sub":
      return [addSub(), addSub()];
    case "mul":
      return ["×", "×"];
    case "div":
      return ["÷", "÷"];
    case "mul_div":
      return [mulDiv(), mulDiv()];
  }
}

function calcResult(a: number, b: number, op: string): number | null {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b !== 0 && a % b === 0 ? a / b : null;
    default:
      return null;
  }
}

function generateCalc3Sheet(params: {
  type: OpType3;
  count: number;
  rangeMin: number;
  rangeMax: number;
  opMin: number;
  opMax: number;
  op2Min: number;
  op2Max: number;
}): Calc3Problem[] {
  const problems: Calc3Problem[] = [];
  const used = new Set<string>();
  let attempts = 0;

  const randRange = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

  while (problems.length < params.count && attempts < 2000) {
    attempts++;
    const [op1, op2] = pickOp(params.type);

    let a: number, b: number, c: number;

    if (op1 === "÷") {
      b = randRange(params.opMin, params.opMax);
      if (b === 0) continue;
      const qMin = Math.ceil(params.rangeMin / b);
      const qMax = Math.floor(params.rangeMax / b);
      if (qMin > qMax || qMin < 1) continue;
      const q = randRange(qMin, qMax);
      a = b * q;
    } else {
      a = randRange(params.rangeMin, params.rangeMax);
      b = randRange(params.opMin, params.opMax);
    }

    const mid = calcResult(a, b, op1);
    if (mid === null || mid < 0) continue;

    if (op2 === "÷") {
      c = randRange(params.op2Min, params.op2Max);
      if (c === 0 || mid % c !== 0) continue;
    } else {
      c = randRange(params.op2Min, params.op2Max);
    }

    const answer = calcResult(mid, c, op2);
    if (answer === null || answer < 0) continue;

    const key = `${a}${op1}${b}${op2}${c}`;
    if (used.has(key)) continue;
    used.add(key);
    problems.push({ a, b, c, op1, op2, answer });
  }

  return problems;
}

function Calc3Sheet({
  problems,
  title,
  sheetNum,
  totalSheets,
}: {
  problems: Calc3Problem[];
  title: string;
  sheetNum: number;
  totalSheets: number;
}) {
  const cols = 3;
  const rows = Math.ceil(problems.length / cols);
  const PAGE_HEIGHT_MM = 297;
  const PAGE_PADDING_Y_MM = 20;
  const HEADER_BLOCK_MM = 16;
  const INSTRUCTION_BLOCK_MM = 18;
  const gridHeightMm = Math.max(120, PAGE_HEIGHT_MM - PAGE_PADDING_Y_MM - HEADER_BLOCK_MM - INSTRUCTION_BLOCK_MM);

  const grid: (Calc3Problem | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: (Calc3Problem | null)[] = [];
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
      <div className="flex justify-between items-center text-sm mb-4 text-gray-400">
        <div className="flex" style={{ gap: 40 }}>
          <span>날짜: ___________</span>
          <span>이름: ___________</span>
        </div>
        <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {problems.length}</span>
      </div>

      <div className="mb-3 text-center" style={{ fontSize: "1.4rem", fontWeight: 900 }}>
        {title}
        {totalSheets > 1 && (
          <span className="text-sm font-normal text-gray-400 ml-2">({sheetNum}/{totalSheets})</span>
        )}
      </div>

      <div className="pb-3 mb-4 border-b border-gray-300" style={{ fontSize: ".9rem", fontWeight: 700, color: "#555" }}>
        계산해 보세요.
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
                  {p.a} {p.op1} {p.b} {p.op2} {p.c} =
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Calc3PreviewContent() {
  const searchParams = useSearchParams();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }

  const params = useMemo(() => {
    const t = searchParams.get("t") as OpType3;
    const c = Number(searchParams.get("c"));
    const s = Number(searchParams.get("s"));
    const mn = Number(searchParams.get("mn"));
    const mx = Number(searchParams.get("mx"));
    const omn = Number(searchParams.get("omn"));
    const omx = Number(searchParams.get("omx"));
    const o2mn = Number(searchParams.get("o2mn"));
    const o2mx = Number(searchParams.get("o2mx"));
    const validTypes = new Set(["add", "sub", "add_sub", "mul", "div", "mul_div"]);

    if (!validTypes.has(t)) return null;
    if (!Number.isInteger(c) || c < 1 || c > 100) return null;
    if (!Number.isInteger(s) || s < 1 || s > 10) return null;
    if (mn < 1 || mx > 9999 || mn > mx) return null;
    if (omn < 1 || omx > 9999 || omn > omx) return null;
    if (o2mn < 1 || o2mx > 9999 || o2mn > o2mx) return null;

    return { type: t, count: c, sheets: s, rangeMin: mn, rangeMax: mx, opMin: omn, opMax: omx, op2Min: o2mn, op2Max: o2mx };
  }, [searchParams]);

  const [allSheets, setAllSheets] = useState<Calc3Problem[][]>([]);

  useEffect(() => {
    if (!params) return;
    setAllSheets(Array.from({ length: params.sheets }, () => generateCalc3Sheet(params)));
  }, [params]);

  useEffect(() => () => {
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  if (!params) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-bold mb-4">잘못된 접근입니다</p>
        <Link href="/calc3" className="text-blue-600 underline">돌아가기</Link>
      </div>
    );
  }

  const typeLabelMap: Record<string, string> = {
    add: "더하기",
    sub: "빼기",
    add_sub: "더하기·빼기 혼합",
    mul: "곱하기",
    div: "나누기",
    mul_div: "곱하기·나누기 혼합",
  };
  const title = `${typeLabelMap[params.type] || "연산"} 연습 (3수)`;
  const expectedCount = params.count * params.sheets;
  const generatedCount = allSheets.reduce((acc, problems) => acc + problems.length, 0);

  async function handleShare() {
    if (allSheets.length === 0) {
      showToast("문제가 생성되지 않았습니다. 다시 생성 후 시도해 주세요.");
      return;
    }

    if (shareUrl || saving) return;
    try {
      setSaving(true);
      const result = await saveWorksheet({
        title,
        type: params!.type,
        operands: [params!.opMin, params!.opMax, params!.op2Min, params!.op2Max],
        rangeMin: params!.rangeMin,
        rangeMax: params!.rangeMax,
        problemCount: params!.count,
        problems: allSheets,
      });
      if ("shortCode" in result) {
        setShareUrl(`${window.location.origin}/s/${result.shortCode}`);
      } else {
        showToast("저장 실패: " + result.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      showToast(`공유 링크 생성 중 오류가 발생했습니다: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
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
    <div>
      {toast && (
        <div className="print:hidden fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-bold animate-fade-in">
          {toast}
        </div>
      )}

      <div className="print:hidden max-w-[800px] mx-auto px-8 pt-6">
        <Link href="/calc3" className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold">
          <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
          <span className="ml-1 transition-all duration-150 group-hover:font-bold">돌아가기</span>
        </Link>
      </div>

      <div className="print:hidden flex justify-center items-center gap-3 py-4 bg-white border-b flex-wrap">
        <button onClick={() => window.print()} className="px-5 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer">
          <Printer className="w-4 h-4 inline mr-1" strokeWidth={1.5} />
          인쇄
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
          <button onClick={handleCopy} className="px-5 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer">
            {copied ? <><Check className="w-4 h-4 inline mr-1" strokeWidth={1.5} />복사됨</> : <><Copy className="w-4 h-4 inline mr-1" strokeWidth={1.5} />링크 복사</>}
          </button>
        )}
      </div>

      {shareUrl && (
        <div className="print:hidden text-center py-2 bg-green-50 border-b border-green-200">
          <span className="text-sm text-green-800">공유 링크: </span>
          <a href={shareUrl} className="text-sm text-green-700 font-bold underline" target="_blank" rel="noopener noreferrer">
            {shareUrl}
          </a>
        </div>
      )}

      {(allSheets.length > 0 && generatedCount !== expectedCount) ? (
        <div className="max-w-[800px] mx-auto px-4 py-3 bg-amber-50 border border-amber-300 rounded-lg mb-3 text-amber-900 text-sm">
          <p className="font-bold mb-2">요청 문항을 모두 만들지 못했습니다.</p>
          <p>
            목표: <span className="font-bold">{expectedCount}문제</span> · 생성됨: <span className="font-bold">{generatedCount}문제</span>
          </p>
          <div className="mt-2 flex gap-2 justify-center flex-wrap">
            <a href="/calc3" className="inline-flex items-center rounded-full bg-amber-700 text-white px-3 py-1 text-xs font-bold hover:bg-amber-800">설정으로 돌아가기</a>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center rounded-full border border-amber-700 text-amber-800 px-3 py-1 text-xs font-bold hover:bg-amber-100"
            >
              다시 생성
            </button>
          </div>
        </div>
      ) : null}

      {allSheets.map((problems, i) => (
        <div key={i} className={i < allSheets.length - 1 ? "break-after-page" : ""}>
          <Calc3Sheet problems={problems} title={title} sheetNum={i + 1} totalSheets={params!.sheets} />
        </div>
      ))}
    </div>
  );
}

export default function Calc3PreviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">로딩 중...</div>}>
      <Calc3PreviewContent />
    </Suspense>
  );
}
