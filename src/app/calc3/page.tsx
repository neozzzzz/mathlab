"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dropdown from "@/components/Dropdown";
import NavBack from "@/components/NavBack";
import Toast from "@/components/ui/Toast";
import RangeNumericInput from "@/components/ui/RangeNumericInput";
import { trackEvent, GA_EVENTS } from "@/lib/ga";

type OpType3 = "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div";

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

  useEffect(
    () => () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    },
    [],
  );

  function normalizeRange(min: number, max: number, setMax: (v: number) => void) {
    if (max > 0 && max < min) {
      showToast("뒷 수가 앞 수보다 작을 수 없습니다");
      setMax(min);
    }
  }

  const teacherPresets = [
    {
      label: "초1~초2 반 기본",
      desc: "연속 수 계산 연습",
      data: { rangeMin: 1, rangeMax: 10, opMin: 1, opMax: 9, op2Min: 1, op2Max: 5, count: 12, sheets: 1 },
    },
    {
      label: "반별 반복 연습",
      desc: "두 자리 숫자+한 자리 보강",
      data: { rangeMin: 5, rangeMax: 20, opMin: 2, opMax: 12, op2Min: 2, op2Max: 12, count: 24, sheets: 1 },
    },
    {
      label: "수업 전용 집중",
      desc: "연산 순서(3수) 강화",
      data: { rangeMin: 10, rangeMax: 40, opMin: 1, opMax: 10, op2Min: 1, op2Max: 10, count: 24, sheets: 2 },
    },
    {
      label: "심화 응용",
      desc: "복합 수식 연습량 확대",
      data: { rangeMin: 20, rangeMax: 80, opMin: 5, opMax: 15, op2Min: 2, op2Max: 12, count: 36, sheets: 2 },
    },
  ] as const;

  function applyPreset(preset: (typeof teacherPresets)[number]["data"]) {
    setRangeMin(preset.rangeMin);
    setRangeMax(preset.rangeMax);
    setOpMin(preset.opMin);
    setOpMax(preset.opMax);
    setOp2Min(preset.op2Min);
    setOp2Max(preset.op2Max);
    setCount(preset.count);
    setSheets(preset.sheets);
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
    trackEvent(GA_EVENTS.GENERATE, { page: "calc3", type, count, sheets, range_min: rangeMin, range_max: rangeMax });
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
      <Toast message={toast} />
      <NavBack href="/" label="메인으로" gaEvent={GA_EVENTS.NAV_HOME} gaFrom="calc3" />
      <div className="max-w-[860px] mx-auto mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Mathlab • Triple Flow</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">일반 연산 (3개의 수)</h1>
        <p className="mt-2 text-sm text-slate-600">3개의 숫자로 단계별 사고를 훈련할 수 있게 구성해 주세요.</p>
      </div>

      <section className="max-w-[860px] mx-auto mb-6 bg-white/95 rounded-[22px] border border-slate-200 p-5">
        <p className="text-xs font-bold text-slate-500">초등교사/학부모 모드</p>
        <h2 className="mt-2 text-lg font-black text-slate-900">빠른 시작 프리셋</h2>
        <p className="mt-1 text-sm text-slate-600">교실·가정 수업 난이도에 맞춰 3수 연산을 바로 설정하세요.</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {teacherPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.data)}
              className="text-left rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 hover:border-slate-900 transition-all"
            >
              <p className="text-sm font-bold text-slate-900">{preset.label}</p>
              <p className="text-xs text-slate-500 mt-1">{preset.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="max-w-[860px] mx-auto bg-white/95 rounded-[28px] border border-slate-200 shadow-[0_20px_54px_rgba(15,23,42,0.08)] p-6 md:p-8">
        <div className="mb-5">
          <p className="block font-bold text-sm mb-2">연산 유형</p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs text-slate-500 font-bold mb-2">더하기/빼기</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {([ ["add", "+더하기"], ["sub", "−빼기"], ["add_sub", "혼합"] ] as [OpType3, string][]).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={type === k}
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
              {([ ["mul", "×곱하기"], ["div", "÷나누기"], ["mul_div", "혼합"] ] as [OpType3, string][]).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={type === k}
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

        <p className="block text-sm font-bold mb-2">수 범위</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <RangeNumericInput
              idPrefix="calc3-range"
              label="첫째 수 범위"
              minValue={rangeMin}
              maxValue={rangeMax}
              onMinChange={setRangeMin}
              onMaxChange={setRangeMax}
              onMinBlur={() => normalizeRange(rangeMin, rangeMax, setRangeMax)}
              onMaxBlur={() => normalizeRange(rangeMin, rangeMax, setRangeMax)}
              onFocusSelect
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <RangeNumericInput
              idPrefix="calc3-op"
              label="둘째 수 범위"
              minValue={opMin}
              maxValue={opMax}
              onMinChange={setOpMin}
              onMaxChange={setOpMax}
              onMinBlur={() => normalizeRange(opMin, opMax, setOpMax)}
              onMaxBlur={() => normalizeRange(opMin, opMax, setOpMax)}
              onFocusSelect
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <RangeNumericInput
              idPrefix="calc3-op2"
              label="셋째 수 범위"
              minValue={op2Min}
              maxValue={op2Max}
              onMinChange={setOp2Min}
              onMaxChange={setOp2Max}
              onMinBlur={() => normalizeRange(op2Min, op2Max, setOp2Max)}
              onMaxBlur={() => normalizeRange(op2Min, op2Max, setOp2Max)}
              onFocusSelect
            />
          </div>
        </div>

        <p className="block font-bold text-sm mb-2">기본 설정</p>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="calc3-count" className="block text-xs text-slate-500 font-bold mb-2">문제수</label>
              <Dropdown
                id="calc3-count"
                value={count}
                options={[12, 18, 24, 36].map((n) => ({ value: n, label: `${n}문제` }))}
                onChange={setCount}
              />
            </div>
            <div>
              <label htmlFor="calc3-sheets" className="block text-xs text-slate-500 font-bold mb-2">장수</label>
              <Dropdown
                id="calc3-sheets"
                value={sheets}
                options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}장` }))}
                onChange={setSheets}
              />
            </div>
          </div>
        </div>

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

        <button
          type="button"
          onClick={generate}
          className="w-full py-3.8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white font-black text-base cursor-pointer transition-all duration-200 mt-2"
        >
          문제 생성
        </button>
      </div>
    </div>
  );
}
