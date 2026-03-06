"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, memo, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import NavBack from "@/components/NavBack";
import Toast from "@/components/ui/Toast";
import PreviewActionButtons from "@/components/ui/PreviewActionButtons";
import { saveWorksheet } from "@/lib/supabase";
import { trackEvent, GA_EVENTS } from "@/lib/ga";
import {
  generateCalc3AllSheets,
  parseCalc3Params,
  type Calc3Problem,
} from "@/lib/math-generator";

const Calc3Sheet = memo(function Calc3Sheet({
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
        {totalSheets > 1 && <span className="text-sm font-normal text-gray-400 ml-2">({sheetNum}/{totalSheets})</span>}
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
              <div key={`${r}-${c}`} className="flex items-center h-full" style={{ borderBottom: "1px solid #f0f0f0" }}>
                <span className="shrink-0 mr-4 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold">{num}</span>
                <span className="text-lg font-semibold tracking-wide">
                  {p.a} {p.op1} {p.b} {p.op2} {p.c} =
                </span>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
});
Calc3Sheet.displayName = "Calc3Sheet";

function Calc3PreviewContent() {
  const searchParams = useSearchParams();
  const queryString = useMemo(() => searchParams.toString(), [searchParams]);
  const params = useMemo(() => parseCalc3Params(queryString), [queryString]);

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [allSheets, setAllSheets] = useState<Calc3Problem[][]>([]);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => {
    if (!params) {
      setAllSheets([]);
      return;
    }
    setAllSheets(generateCalc3AllSheets(params, queryString));
  }, [params, queryString]);

  useEffect(
    () => () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    },
    [],
  );

  if (!params) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-bold mb-4">잘못된 접근입니다</p>
        <Link href="/calc3" className="text-blue-600 underline">
          돌아가기
        </Link>
      </div>
    );
  }

  const resolvedParams = params;
  const typeLabelMap: Record<string, string> = {
    add: "더하기",
    sub: "빼기",
    add_sub: "더하기·빼기 혼합",
    mul: "곱하기",
    div: "나누기",
    mul_div: "곱하기·나누기 혼합",
  };
  const title = `${typeLabelMap[resolvedParams.type] || "연산"} 연습 (3수)`;
  const isReady =
    allSheets.length === resolvedParams.sheets && allSheets.every((sheet) => sheet.length === resolvedParams.count);

  async function handleShare() {
    if (!isReady) {
      showToast("문항을 생성 중입니다. 잠시 후 공유해 주세요.");
      return;
    }
    if (shareUrl || saving) return;
    try {
      setSaving(true);
      const result = await saveWorksheet({
        title,
        type: resolvedParams.type,
        operands: [resolvedParams.opMin, resolvedParams.opMax, resolvedParams.op2Min, resolvedParams.op2Max],
        rangeMin: resolvedParams.rangeMin,
        rangeMax: resolvedParams.rangeMax,
        problemCount: resolvedParams.count,
        problems: allSheets as never,
      });
      if ("shortCode" in result) {
        setShareUrl(`${window.location.origin}/s/${result.shortCode}`);
      } else {
        showToast("저장 실패: " + result.error);
      }
    } catch {
      showToast("공유 링크 생성 중 오류가 발생했습니다");
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
    <div className="min-h-screen bg-slate-100/60">
      <Toast message={toast} className="print:hidden fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-bold animate-fade-in" />
      <NavBack href="/calc3" label="돌아가기" gaEvent={GA_EVENTS.NAV_BACK} gaFrom="calc3" />
      <div className="max-w-[860px] mx-auto px-6">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 mt-5 mb-4 flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold tracking-[0.15em] text-slate-500">ACTION BAR</p>
          <span className="ml-auto h-1 w-1.5 bg-slate-300 rounded-full" />
          <span className="text-sm text-slate-700">문항 생성 후 바로 미리보기 인쇄·공유가 가능해요.</span>
        </div>
      </div>

      {!isReady ? (
        <div className="max-w-[860px] mx-auto px-6 mb-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
          요청한 문항 수를 모두 만들지 못했습니다. 범위를 완화하거나 수/연산 범위를 줄여 다시 생성해 주세요.
        </div>
      ) : null}

      <PreviewActionButtons
        shareUrl={shareUrl}
        saving={saving}
        copied={copied}
        onPrint={() => {
          trackEvent(GA_EVENTS.PRINT, { page: "calc3" });
          window.print();
        }}
        onShare={handleShare}
        onCopy={handleCopy}
      />

      {shareUrl && (
        <div className="print:hidden text-center py-2 bg-green-50 border-b border-green-200">
          <span className="text-sm text-green-800">공유 링크: </span>
          <a href={shareUrl} className="text-sm text-green-700 font-bold underline" target="_blank" rel="noopener noreferrer">
            {shareUrl}
          </a>
        </div>
      )}

      {allSheets.map((problems, i) => (
        <div
          key={`sheet-${i + 1}-${problems.map((p) => `${p.a}-${p.op1}-${p.b}-${p.op2}-${p.c}`).join("|")}`}
          className={i < allSheets.length - 1 ? "break-after-page" : ""}
        >
          <Calc3Sheet problems={problems} title={title} sheetNum={i + 1} totalSheets={resolvedParams.sheets} />
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
