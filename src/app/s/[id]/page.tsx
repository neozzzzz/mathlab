"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getWorksheet, type WorksheetRow } from "@/lib/supabase";
import { Printer } from "lucide-react";
import Link from "next/link";

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

interface Problem {
  top: number[];
  op: number;
  bottom: number[];
  type: "add" | "sub";
}

function ProblemCard({ problem, index }: { problem: Problem; index: number }) {
  const circleLabel = String(problem.op);
  return (
    <div
      className="relative flex items-center gap-[6px]"
      style={{ border: "2px solid #e0e0e0", borderRadius: 12, padding: "20px 16px" }}
    >
      <div
        className="absolute"
        style={{ top: -10, left: 12, background: "#ff9800", color: "#fff", fontSize: ".7rem", fontWeight: 700, padding: "2px 10px", borderRadius: 100 }}
      >
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
              <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: "1.1rem", fontWeight: 700, border: `2px solid ${TOP_COLORS[j].border}`, color: "#222", background: "#fff" }}>{n}</div>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", margin: "4px 0", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties} />
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

  const sheets = ws.problems as Problem[][];
  const instruction = ws.type === "sub"
    ? "⭕의 수를 빼어서 나온 결과를 선으로 이어 보세요."
    : "⭕의 수를 더해서 나온 결과를 선으로 이어 보세요.";

  return (
    <div>
      <div className="print:hidden flex justify-center items-center gap-3 py-4 bg-white border-b">
        <Link href="/" className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300">← 새로 만들기</Link>
        <button onClick={() => window.print()} className="px-5 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black cursor-pointer"><Printer className="w-4 h-4 inline mr-1" strokeWidth={1.5} />인쇄</button>
      </div>

      {sheets.map((problems, i) => (
        <div key={i} className={i < sheets.length - 1 ? "break-after-page" : ""}>
          <div className="bg-white max-w-[800px] mx-auto" style={{ padding: 32, fontFamily: "'Noto Sans KR', sans-serif" }}>
            <div className="flex justify-between items-end mb-4 pb-2.5">
              <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>
                {ws.title}
                {sheets.length > 1 && <span className="text-sm font-normal text-gray-400 ml-2">({i + 1}/{sheets.length})</span>}
              </div>
              <div className="flex text-sm" style={{ gap: 120 }}>
                <span>날짜: </span>
                <span>이름: </span>
                <span>점수:&nbsp;&nbsp;&nbsp;&nbsp;/ {ws.problem_count}</span>
              </div>
            </div>
            <div style={{ borderLeft: "4px solid #ff9800", padding: "8px 12px", borderRadius: "0 8px 8px 0", marginBottom: 24, fontSize: ".9rem", fontWeight: 700 }}>{instruction}</div>
            <div className="grid grid-cols-2 max-[600px]:grid-cols-1" style={{ gap: "16px 12px" }}>
              {problems.map((p, j) => <ProblemCard key={j} problem={p} index={j} />)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
