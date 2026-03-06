"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, memo, useEffect, useMemo, useRef, useState } from "react";
import { parseMatchParams, generateMatchAllSheets, type MatchProblem } from "@/lib/math-generator";
import { saveWorksheet } from "@/lib/supabase";
import Link from "next/link";
import NavBack from "@/components/NavBack";
import { trackEvent, GA_EVENTS } from "@/lib/ga";
import Toast from "@/components/ui/Toast";
import PreviewActionButtons from "@/components/ui/PreviewActionButtons";

const TOP_COLORS = [
  { border: "#90caf9", label: "blue" },
  { border: "#a5d6a7", label: "green" },
  { border: "#ffcc80", label: "orange" },
];
const BOT_COLORS = [
  { border: "#ef9a9a", label: "red" },
  { border: "#ce93d8", label: "purple" },
  { border: "#80cbc4", label: "teal" },
];

const ProblemCard = memo(function ProblemCard({ problem, index }: { problem: MatchProblem; index: number }) {
  const circleLabel = String(problem.op);
  return (
    <div
      className="relative flex items-center gap-[6px]"
      style={{
        border: "2px solid #e0e0e0",
        borderRadius: 12,
        padding: "20px 16px",
      }}
    >
      {/* 문제 번호 */}
      <div
        className="absolute"
        style={{
          top: -10,
          left: 12,
          background: "#ff9800",
          color: "#fff",
          fontSize: ".7rem",
          fontWeight: 700,
          padding: "2px 10px",
          borderRadius: 100,
        }}
      >
        {index + 1}
      </div>

      {/* 빨간 원 */}
      <div
        style={{
          width: 57,
          height: 57,
          minWidth: 57,
          marginLeft: 8,
          borderRadius: "50%",
          border: "3px solid #e91e63",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.4rem",
          fontWeight: 900,
          color: "#c2185b",
        }}
      >
        {circleLabel}
      </div>

      {/* 숫자 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 윗줄 */}
        <div className="flex justify-center" style={{ gap: 20 }}>
          {problem.top.map((n, j) => (
            <div key={`${n}-${j}`} className="flex flex-col items-center">
              <div
                style={{
                  width: 48,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  border: `2px solid ${TOP_COLORS[j].border}`,
                  color: "#222",
                  background: "#fff",
                }}
              >
                {n}
              </div>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#555",
                  margin: "4px 0",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>

        {/* dot-area */}
        <div style={{ padding: "14px 0" }} />

        {/* 아랫줄 */}
        <div className="flex justify-center" style={{ gap: 20 }}>
          {problem.bottom.map((n, j) => (
            <div key={`${n}-${j}`} className="flex flex-col items-center">
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#555",
                  margin: "4px 0",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                } as React.CSSProperties}
              />
              <div
                style={{
                  width: 48,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  border: `2px solid ${BOT_COLORS[j].border}`,
                  color: "#222",
                  background: "#fff",
                }}
              >
                {n}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
ProblemCard.displayName = "ProblemCard";

const Sheet = memo(function Sheet({
  problems,
  title,
  count,
  sheetNum,
  totalSheets,
  type,
}: {
  problems: MatchProblem[];
  title: string;
  count: number;
  sheetNum: number;
  totalSheets: number;
  type: "add" | "sub";
}) {
  const instruction =
    type === "sub"
      ? "⭕의 수를 빼어서 나온 결과를 선으로 이어 보세요."
      : "⭕의 수를 더해서 나온 결과를 선으로 이어 보세요.";
  const rowCount = Math.ceil(problems.length / 2);

  return (
    <div className="sheet bg-white mx-auto" style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box", padding: "10mm 12mm" }}>
      {/* 1행: 날짜 · 이름 · 점수 */}
      <div className="flex justify-between items-center text-sm mb-4 text-gray-400">
        <div className="flex" style={{ gap: 40 }}>
          <span>날짜: ___________</span>
          <span>이름: ___________</span>
        </div>
        <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {count}</span>
      </div>

      {/* 2행: 제목 */}
      <div className="mb-3 text-center" style={{ fontSize: "1.4rem", fontWeight: 900 }}>
        {title}
        {totalSheets > 1 && (
          <span className="text-sm font-normal text-gray-400 ml-2">({sheetNum}/{totalSheets})</span>
        )}
      </div>

      {/* 3행: 설명 */}
      <div className="pb-3 mb-4 border-b border-gray-300" style={{ fontSize: ".9rem", fontWeight: 700, color: "#555" }}>
        {instruction}
      </div>

      {/* 문제 그리드 */}
      <div
        className="grid grid-cols-2"
        style={{
          height: "243mm",
          gap: "16px 12px",
          gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
        }}
      >
        {problems.map((p, i) => (
          <div key={`${p.type}-${p.op}-${p.top.join("-")}-${p.bottom.join("-")}`} className="h-full flex items-center">
            <div className="w-full">
              <ProblemCard problem={p} index={i} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
Sheet.displayName = "Sheet";

function PreviewContent() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const params = useMemo(() => parseMatchParams(queryString), [queryString]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [allSheets, setAllSheets] = useState<MatchProblem[][]>([]);

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
    setAllSheets(generateMatchAllSheets(params, queryString));
  }, [params, queryString]);

  useEffect(() => () => {
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  if (!params) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-bold mb-4">잘못된 접근입니다</p>
        <Link href="/match" className="text-blue-600 underline">
          메인으로 돌아가기
        </Link>
      </div>
    );
  }

  const resolvedParams = params;
  const typeLabel = resolvedParams.type === "sub" ? "빼기" : "더하기";
  const title = `${typeLabel} ${resolvedParams.operands.join(", ")}`;

  async function handleShare() {
    if (shareUrl || saving) return;
    trackEvent(GA_EVENTS.SHARE_CREATE, { page: 'match' });
    try {
      setSaving(true);
      const result = await saveWorksheet({
        title,
        type: resolvedParams.type,
        operands: resolvedParams.operands,
        rangeMin: resolvedParams.rangeMin,
        rangeMax: resolvedParams.rangeMax,
        problemCount: resolvedParams.count,
        problems: allSheets,
      });
      if ("shortCode" in result) {
        const url = `${window.location.origin}/s/${result.shortCode}`;
        setShareUrl(url);
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
    trackEvent(GA_EVENTS.SHARE_COPY, { page: 'match' });
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
      {/* 상단 버튼 (인쇄 시 숨김) */}
      <NavBack href="/match" label="돌아가기" gaEvent={GA_EVENTS.NAV_BACK} gaFrom="match" />
      <div className="max-w-[860px] mx-auto px-6">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 mt-5 mb-4 flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold tracking-[0.15em] text-slate-500">ACTION BAR</p>
          <span className="ml-auto h-1 w-1.5 bg-slate-300 rounded-full" />
          <span className="text-sm text-slate-700">문항 생성 후 바로 미리보기 인쇄·공유가 가능해요.</span>
        </div>
      </div>

      <PreviewActionButtons
        shareUrl={shareUrl}
        saving={saving}
        copied={copied}
        onPrint={() => {
          trackEvent(GA_EVENTS.PRINT, { page: "match" });
          window.print();
        }}
        onShare={handleShare}
        onCopy={handleCopy}
      />
      {shareUrl && (
        <div className="print:hidden text-center py-2 bg-green-50 border-b border-green-200">
          <span className="text-sm text-green-800">공유 링크: </span>
          <a href={shareUrl} className="text-sm text-green-700 font-bold underline" target="_blank" rel="noopener noreferrer">{shareUrl}</a>
        </div>
      )}

      {/* 시트들 */}
      {allSheets.map((problems, i) => (
        <div
          key={`sheet-${i + 1}-${problems.map((p) => `${p.type}-${p.op}-${p.top.join("-")}-${p.bottom.join("-")}`).join("|")}`}
          className={i < allSheets.length - 1 ? "break-after-page" : ""}
        >
          <Sheet
            problems={problems}
            title={title}
            count={resolvedParams.count}
            sheetNum={i + 1}
            totalSheets={resolvedParams.sheets}
            type={resolvedParams.type}
          />
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
