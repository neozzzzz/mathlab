"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dropdown from "@/components/Dropdown";
import NavBack from "@/components/NavBack";
import { trackEvent, GA_EVENTS } from "@/lib/ga";
import { encodeParams, type GeneratorParams } from "@/lib/generator";

export default function Home() {
  const router = useRouter();
  const [type, setType] = useState<"add" | "sub" | null>("add");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }
  useEffect(() => () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  const [operands, setOperands] = useState("8,9");
  const [count, setCount] = useState(8);
  const [sheets, setSheets] = useState(1);
  const [rangeMin, setRangeMin] = useState(11);
  const [rangeMax, setRangeMax] = useState(18);

  const generate = () => {
    if (!type) {
      showToast("연산 유형을 선택해주세요");
      return;
    }
    const ops = operands
      .split(",")
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));
    if (ops.length === 0) {
      showToast("계산 결과 값을 입력해주세요");
      return;
    }
    const params: GeneratorParams = {
      type,
      operands: ops,
      count,
      sheets,
      rangeMin,
      rangeMax,
    };
    trackEvent(GA_EVENTS.GENERATE, { page: 'match', type, count, sheets, range_min: rangeMin, range_max: rangeMax });
    router.push(`/preview?${encodeParams(params)}`);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-100/70 px-4 pb-8">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in">
          {toast}
        </div>
      )}
      <NavBack href="/" label="메인으로" gaEvent={GA_EVENTS.NAV_HOME} gaFrom="match" />
      <div className="max-w-[860px] mx-auto mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Mathlab • Match</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">짝 맞추기</h1>
        <p className="mt-2 text-sm text-slate-600">문제 생성과 동시에 결과형 연결 방식까지 한 번에 준비.</p>
      </div>

      <div className="max-w-[860px] mx-auto bg-white/95 rounded-[28px] border border-slate-200 shadow-[0_20px_54px_rgba(15,23,42,0.08)] p-6 md:p-8">
        {/* 연산 유형 */}
        <div className="mb-5">
          <label className="block font-bold text-sm mb-2">연산 유형</label>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs text-slate-500 font-bold mb-2">더하기/빼기</p>
            <div className="grid grid-cols-2 gap-2">
              {([["add", "+더하기"], ["sub", "−빼기"]] as ["add" | "sub", string][]).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setType(k)}
                  className={`w-full text-center py-2.5 px-2 border-2 rounded-xl font-bold text-sm cursor-pointer transition-all ${
                    type === k
                      ? "border-slate-900 bg-slate-900/5 text-slate-900"
                      : "border-slate-200 bg-white hover:border-slate-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 수 범위 */}
        <label className="block font-bold text-sm mb-2">수 범위</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="block text-xs text-slate-500 font-bold mb-2">숫자 범위</p>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                inputMode="numeric"
                value={rangeMin}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setRangeMin(v === '' ? 0 : parseInt(v, 10)); }}
                onBlur={() => { if (rangeMax > 0 && rangeMax < rangeMin) { showToast('뒷 수가 앞 수보다 작을 수 없습니다'); setRangeMax(rangeMin); } }}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
              <span className="font-bold text-gray-400">~</span>
              <input
                type="text"
                inputMode="numeric"
                value={rangeMax}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setRangeMax(v === '' ? 0 : parseInt(v, 10)); }}
                onBlur={() => { if (rangeMax > 0 && rangeMax < rangeMin) { showToast('뒷 수가 앞 수보다 작을 수 없습니다'); setRangeMax(rangeMin); } }}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="block text-xs text-slate-500 font-bold mb-2">계산 결과 값</p>
            <input
              type="text"
              value={operands}
              inputMode="numeric"
              onChange={(e) => setOperands(e.target.value.replace(/[^\d,]/g, ''))}
              placeholder="예: 6,7"
              className="w-full p-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 bg-white"
            />
          </div>
        </div>

        {/* 기본 설정 */}
        <label className="block font-bold text-sm mb-2">기본 설정</label>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="block text-xs text-slate-500 font-bold mb-2">문제수</p>
              <Dropdown
                value={count}
                options={[6, 8].map((n) => ({ value: n, label: `${n}문제` }))}
                onChange={setCount}
              />
            </div>
            <div>
              <p className="block text-xs text-slate-500 font-bold mb-2">장수</p>
              <Dropdown
                value={sheets}
                options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}장` }))}
                onChange={setSheets}
              />
            </div>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
          <p className="text-xs text-slate-500 mb-3 font-medium">미리보기</p>
          <div className="flex items-center gap-[6px]" style={{ transform: "scale(0.85)", transformOrigin: "left center" }}>
            <div style={{ width: 57, height: 57, minWidth: 57, marginLeft: 80, borderRadius: "50%", border: "3px solid #e91e63", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 900, color: "#c2185b" }}>
              {(operands.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n))[0]) || "?"}
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-center" style={{ gap: 20 }}>
                {(() => {
                  const tops = rangeMin > 0 && rangeMax > 0 ? [rangeMin, rangeMin + 2, rangeMax] : [11, 13, 18];
                  const borders = ["#90caf9", "#a5d6a7", "#ffcc80"];
                  return tops.map((n, j) => (
                    <div key={j} className="flex flex-col items-center">
                      <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: "1.1rem", fontWeight: 700, border: `2px solid ${borders[j]}`, color: "#222", background: "#fff" }}>{n}</div>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", margin: "4px 0" }} />
                    </div>
                  ));
                })()}
              </div>
              <div style={{ padding: "10px 0" }} />
              <div className="flex justify-center" style={{ gap: 20 }}>
                {(() => {
                  const op = operands.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n))[0];
                  const tops = rangeMin > 0 && rangeMax > 0 ? [rangeMin, rangeMin + 2, rangeMax] : [11, 13, 18];
                  const hasAll = type && op !== undefined;
                  const results = hasAll ? tops.map(n => type === "sub" ? n - op : n + op) : null;
                  const borders = ["#ef9a9a", "#ce93d8", "#80cbc4"];
                  return [0, 1, 2].map((j) => (
                    <div key={j} className="flex flex-col items-center">
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", margin: "4px 0" }} />
                      <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: "1.1rem", fontWeight: 700, border: `2px solid ${borders[j]}`, color: "#222", background: "#fff" }}>{results ? results[j] : "?"}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 생성 버튼 */}
        <button
          onClick={generate}
          className="w-full py-3.8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white font-black text-base cursor-pointer transition-all duration-200 mt-2"
        >
          문제 생성
        </button>
      </div>
    </div>
  );
}
