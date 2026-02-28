"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dropdown from "@/components/Dropdown";
import NavBack from "@/components/NavBack";
import { trackEvent, GA_EVENTS } from "@/lib/ga";

type OpType3 = "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div";

function parseNumericInput(v: string) {
  const raw = v.replace(/\D/g, "");
  return raw === "" ? 0 : parseInt(raw, 10);
}

export default function Calc3Page() {
  const router = useRouter();
  const [type, setType] = useState<OpType3>("add");
  const [count, setCount] = useState(24);
  const [sheets, setSheets] = useState(1);
  const [rangeMin, setRangeMin] = useState(1);
  const [rangeMax, setRangeMax] = useState(20);
  const [opMin, setOpMin] = useState(1);
  const [opMax, setOpMax] = useState(9);
  const [op2Min, setOp2Min] = useState(1);
  const [op2Max, setOp2Max] = useState(9);
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

  function normalizeRange(min: number, max: number, setMax: (v: number) => void) {
    if (max > 0 && max < min) {
      showToast("뒷 수가 앞 수보다 작을 수 없습니다");
      setMax(min);
    }
  }

  function generate() {
    if (rangeMin <= 0 || rangeMax <= 0 || opMin <= 0 || opMax <= 0 || op2Min <= 0 || op2Max <= 0) {
      showToast("숫자 범위를 입력해주세요");
      return;
    }
    const params = new URLSearchParams({
      mode: "calc3",
      t: type,
      c: String(count),
      s: String(sheets),
      mn: String(rangeMin),
      mx: String(rangeMax),
      omn: String(opMin),
      omx: String(opMax),
      o2mn: String(op2Min),
      o2mx: String(op2Max),
    });
    trackEvent(GA_EVENTS.GENERATE, { page: 'calc3', type, count, sheets, range_min: rangeMin, range_max: rangeMax });
    router.push(`/calc3/preview?${params.toString()}`);
  }

  const previewProblems = [0, 1, 2].map((i) => {
    const a = i === 0 ? rangeMin : i === 1 ? Math.round((rangeMin + rangeMax) / 2) : rangeMax;
    const b = i === 0 ? opMin : i === 1 ? Math.round((opMin + opMax) / 2) : opMax;
    const c = i === 0 ? op2Min : i === 1 ? Math.round((op2Min + op2Max) / 2) : op2Max;
    const signs1: Record<OpType3, string> = { add: "+", sub: "−", add_sub: i === 0 ? "+" : "−", mul: "×", div: "÷", mul_div: i === 0 ? "×" : "÷" };
    const signs2: Record<OpType3, string> = { add: "+", sub: "−", add_sub: i === 2 ? "−" : "+", mul: "×", div: "÷", mul_div: i === 2 ? "÷" : "×" };
    return { a, b, c, s1: signs1[type], s2: signs2[type] };
  });

  return (
    <div className="min-h-[100dvh] bg-slate-100/70 px-4 pb-8">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in">
          {toast}
        </div>
      )}
      <NavBack href="/" label="메인으로" gaEvent={GA_EVENTS.NAV_HOME} gaFrom="calc3" />
      <div className="max-w-[860px] mx-auto mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Mathlab • Triple Flow</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">일반 연산 (3개의 수)</h1>
        <p className="mt-2 text-sm text-slate-600">3개 숫자 연산은 단계 사고 연습에 최적화되어 있습니다.</p>
      </div>

      <div className="max-w-[860px] mx-auto bg-white/95 rounded-[28px] border border-slate-200 shadow-[0_20px_54px_rgba(15,23,42,0.08)] p-6 md:p-8">
        {/* 연산 유형 */}
        <div className="mb-5">
          <label className="block font-bold text-sm mb-2">연산 유형</label>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs text-slate-500 font-bold mb-2">더하기/빼기</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {([["add", "+더하기"], ["sub", "−빼기"], ["add_sub", "혼합"]] as [OpType3, string][]).map(([k, label]) => (
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
            <p className="text-xs text-slate-500 font-bold mb-2">곱하기/나누기</p>
            <div className="grid grid-cols-3 gap-2">
              {([["mul", "×곱하기"], ["div", "÷나누기"], ["mul_div", "혼합"]] as [OpType3, string][]).map(([k, label]) => (
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
        <label className="block text-sm font-bold mb-2">수 범위</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="block text-xs text-slate-500 font-bold mb-2">첫째 수 범위</p>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                inputMode="numeric"
                value={rangeMin}
                onChange={(e) => setRangeMin(parseNumericInput(e.target.value))}
                onBlur={() => normalizeRange(rangeMin, rangeMax, setRangeMax)}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
              <span className="font-bold text-gray-400">~</span>
              <input
                type="text"
                inputMode="numeric"
                value={rangeMax}
                onChange={(e) => setRangeMax(parseNumericInput(e.target.value))}
                onBlur={() => normalizeRange(rangeMin, rangeMax, setRangeMax)}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="block text-xs text-slate-500 font-bold mb-2">둘째 수 범위</p>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                inputMode="numeric"
                value={opMin}
                onChange={(e) => setOpMin(parseNumericInput(e.target.value))}
                onBlur={() => normalizeRange(opMin, opMax, setOpMax)}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
              <span className="font-bold text-gray-400">~</span>
              <input
                type="text"
                inputMode="numeric"
                value={opMax}
                onChange={(e) => setOpMax(parseNumericInput(e.target.value))}
                onBlur={() => normalizeRange(opMin, opMax, setOpMax)}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="block text-xs text-slate-500 font-bold mb-2">셋째 수 범위</p>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                inputMode="numeric"
                value={op2Min}
                onChange={(e) => setOp2Min(parseNumericInput(e.target.value))}
                onBlur={() => normalizeRange(op2Min, op2Max, setOp2Max)}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
              <span className="font-bold text-gray-400">~</span>
              <input
                type="text"
                inputMode="numeric"
                value={op2Max}
                onChange={(e) => setOp2Max(parseNumericInput(e.target.value))}
                onBlur={() => normalizeRange(op2Min, op2Max, setOp2Max)}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
            </div>
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
                options={[12, 18, 24, 36].map((n) => ({ value: n, label: `${n}문제` }))}
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
          <div className="flex flex-col gap-2 text-lg font-semibold" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
            {previewProblems.map((p, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="shrink-0 mr-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">{i + 1}</span>
                <span>{p.a} {p.s1} {p.b} {p.s2} {p.c} =</span>
              </div>
            ))}
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
