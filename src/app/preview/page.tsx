"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { decodeParams, generateAllSheets, type Problem } from "@/lib/generator";
import { saveWorksheet } from "@/lib/supabase";
import { Printer, Share2, Copy, Check } from "lucide-react";
import Link from "next/link";

const TOP_COLORS = [
  { border: "#42a5f5", label: "blue" },
  { border: "#66bb6a", label: "green" },
  { border: "#ffa726", label: "orange" },
];
const BOT_COLORS = [
  { border: "#ef5350", label: "red" },
  { border: "#ab47bc", label: "purple" },
  { border: "#26a69a", label: "teal" },
];

function ProblemCard({ problem, index }: { problem: Problem; index: number }) {
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
            <div key={j} className="flex flex-col items-center">
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
            <div key={j} className="flex flex-col items-center">
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
}

function Sheet({
  problems,
  title,
  count,
  sheetNum,
  totalSheets,
  type,
}: {
  problems: Problem[];
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

  return (
    <div className="sheet bg-white max-w-[800px] mx-auto" style={{ padding: 32 }}>
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
          <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {count}</span>
        </div>
      </div>

      {/* 지시문 */}
      <div
        style={{
          borderLeft: "4px solid #ff9800",
          padding: "8px 12px",
          borderRadius: "0 8px 8px 0",
          marginBottom: 24,
          fontSize: ".9rem",
          fontWeight: 700,
        }}
      >
        {instruction}
      </div>

      {/* 문제 그리드 */}
      <div
        className="grid grid-cols-2 max-[600px]:grid-cols-1"
        style={{ gap: "16px 12px" }}
      >
        {problems.map((p, i) => (
          <ProblemCard key={i} problem={p} index={i} />
        ))}
      </div>
    </div>
  );
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const params = decodeParams(searchParams.toString());
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const allSheets = useMemo(() => {
    if (!params) return [];
    return generateAllSheets(params);
  }, [searchParams.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!params) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-bold mb-4">잘못된 접근입니다</p>
        <Link href="/" className="text-blue-600 underline">
          메인으로 돌아가기
        </Link>
      </div>
    );
  }

  const typeLabel = params.type === "sub" ? "빼기" : "더하기";
  const title = `${typeLabel} ${params.operands.join(", ")}`;

  async function handleShare() {
    if (shareUrl || saving) return;
    setSaving(true);
    const result = await saveWorksheet({
      title,
      type: params!.type,
      operands: params!.operands,
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
      {/* 상단 버튼 (인쇄 시 숨김) */}
      <div className="print:hidden flex justify-center items-center gap-3 py-4 bg-white border-b flex-wrap">
        <Link
          href="/"
          className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300"
        >
          ← 돌아가기
        </Link>
        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-blue-700 text-white rounded-lg font-bold text-sm hover:bg-blue-800 cursor-pointer"
        >
          인쇄
        </button>
        {!shareUrl ? (
          <button
            onClick={handleShare}
            disabled={saving}
            className="px-5 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 cursor-pointer disabled:opacity-50"
          >
            {saving ? "저장 중..." : <><Share2 className="w-4 h-4 inline mr-1" strokeWidth={1.5} />공유 링크 생성</>}
          </button>
        ) : (
          <button
            onClick={handleCopy}
            className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 cursor-pointer"
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

      {/* 시트들 */}
      {allSheets.map((problems, i) => (
        <div key={i} className={i < allSheets.length - 1 ? "break-after-page" : ""}>
          <Sheet
            problems={problems}
            title={title}
            count={params.count}
            sheetNum={i + 1}
            totalSheets={params.sheets}
            type={params.type}
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
