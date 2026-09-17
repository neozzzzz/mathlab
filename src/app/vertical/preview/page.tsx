"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Printer, Share2, Copy, Check } from "lucide-react";
import { parseCalcParams, generateCalcAllSheets, type CalcProblem } from "@/lib/math-generator";
import { saveWorksheet } from "@/lib/supabase";
import { trackEvent, GA_EVENTS } from "@/lib/ga";
import { BoxCell, NumberBox, splitToCells } from "@/components/math/BoxCell";

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

function PreviewContent() {
  const searchParams = useSearchParams();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  const queryString = searchParams.toString();
  const params = useMemo(() => parseCalcParams(searchParams), [searchParams]);
  const validParams = params?.type === "mixed_addition" ? params : null;
  const allSheets = useMemo(() => {
    if (!validParams) return [];
    return generateCalcAllSheets(validParams, queryString);
  }, [queryString, validParams]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }

  if (!validParams) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-sm">
          <p className="text-lg font-bold mb-4">잘못된 접근입니다</p>
          <Link href="/vertical" className="text-blue-600 underline">돌아가기</Link>
        </div>
      </div>
    );
  }

  const safeParams = validParams;
  const title = "세로셈 연습";
  const expectedCount = safeParams.count * safeParams.sheets;
  const generatedCount = allSheets.reduce((acc, problems) => acc + problems.length, 0);

  async function handleShare() {
    if (allSheets.length === 0 || saving || shareUrl) return;

    trackEvent(GA_EVENTS.SHARE_CREATE, { page: "vertical", type: safeParams.type });

    try {
      setSaving(true);
      const result = await saveWorksheet({
        title,
        type: safeParams.type,
        operands: [safeParams.opMin, safeParams.opMax],
        rangeMin: safeParams.rangeMin,
        rangeMax: safeParams.rangeMax,
        problemCount: safeParams.count,
        problems: allSheets,
      });

      if ("shortCode" in result) {
        const url = `${window.location.origin}/s/${result.shortCode}`;
        setShareUrl(url);
      } else {
        showToast(`저장 실패: ${result.error}`);
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
    trackEvent(GA_EVENTS.SHARE_COPY, { page: "vertical" });

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
          <Link
            href="/vertical"
            onClick={() => trackEvent(GA_EVENTS.NAV_BACK, { from: "vertical_preview" })}
            className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold"
          >
            <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
            <span className="ml-1 transition-all duration-150 group-hover:font-bold">설정으로 돌아가기</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                trackEvent(GA_EVENTS.PRINT, { page: "vertical" });
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

      {allSheets.map((problems, index) => (
        <div key={index} className={index < allSheets.length - 1 ? "break-after-page" : ""}>
          <MixedAdditionSheet
            problems={problems as CalcProblem[]}
            title={title}
            count={safeParams.count}
            sheetNum={index + 1}
            totalSheets={safeParams.sheets}
          />
        </div>
      ))}
    </div>
  );
}

export default function VerticalPreviewPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">로딩 중...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
