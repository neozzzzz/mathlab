"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Dropdown from "@/components/Dropdown";

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
  useEffect(() => () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

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
    router.push(`/calc3/preview?${params.toString()}`);
  }

  // 미리보기용 계산
  const previewProblems = [0, 1, 2].map((i) => {
    const a = i === 0 ? rangeMin : i === 1 ? Math.round((rangeMin + rangeMax) / 2) : rangeMax;
    const b = i === 0 ? opMin : i === 1 ? Math.round((opMin + opMax) / 2) : opMax;
    const c = i === 0 ? op2Min : i === 1 ? Math.round((op2Min + op2Max) / 2) : op2Max;
    const signs1: Record<OpType3, string> = { add: "+", sub: "−", add_sub: i === 0 ? "+" : "−", mul: "×", div: "÷", mul_div: i === 0 ? "×" : "÷" };
    const signs2: Record<OpType3, string> = { add: "+", sub: "−", add_sub: i === 2 ? "−" : "+", mul: "×", div: "÷", mul_div: i === 2 ? "÷" : "×" };
    return { a, b, c, s1: signs1[type], s2: signs2[type] };
  });

  return (
    <div className="max-w-[600px] mx-auto p-8 relative">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-bold animate-fade-in">
          {toast}
        </div>
      )}
      <Link href="/" className="inline-block mb-4 text-sm text-gray-400 hover:text-gray-600">← 메인으로</Link>
      <h1 className="text-2xl font-black text-center mb-6">일반 연산 (3개의 수)</h1>

      <div className="bg-white rounded-2xl p-7 shadow-md">
        {/* 연산 유형 */}
        <div className="mb-5">
          <div className="mb-3">
            <label className="block font-bold text-sm mb-2">더하기 · 빼기</label>
            <div className="flex gap-2">
              {([["add", "더하기"], ["sub", "빼기"], ["add_sub", "혼합"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setType(k)}
                  className={`flex-1 py-2.5 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                    type === k
                      ? "border-gray-900 bg-[#ddd]/50 text-black"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-bold text-sm mb-2">곱하기 · 나누기</label>
            <div className="flex gap-2">
              {([["mul", "곱하기"], ["div", "나누기"], ["mul_div", "혼합"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setType(k)}
                  className={`flex-1 py-2.5 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                    type === k
                      ? "border-gray-900 bg-[#ddd]/50 text-black"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 문제 수 & 장 수 */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block font-bold text-sm mb-2">문제 수 (장당)</label>
            <Dropdown
              value={count}
              options={[12, 18, 24, 36].map(n => ({ value: n, label: `${n}문제` }))}
              onChange={setCount}
            />
          </div>
          <div className="flex-1">
            <label className="block font-bold text-sm mb-2">장 수</label>
            <Dropdown
              value={sheets}
              options={[1, 2, 3, 4, 5].map(n => ({ value: n, label: `${n}장` }))}
              onChange={setSheets}
            />
          </div>
        </div>

        {/* 숫자 범위 3개 (한 줄) */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block font-bold text-sm mb-2">첫째 수</label>
            <div className="flex gap-1 items-center">
              <input type="text" inputMode="numeric" value={rangeMin}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setRangeMin(v === '' ? 0 : parseInt(v, 10)); }}
                onFocus={(e) => e.target.select()}
                className="w-14 p-2 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-gray-900" />
              <span className="font-bold text-gray-400 text-xs">~</span>
              <input type="text" inputMode="numeric" value={rangeMax}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setRangeMax(v === '' ? 0 : parseInt(v, 10)); }}
                onBlur={() => { if (rangeMax > 0 && rangeMax < rangeMin) { showToast('뒷 수가 앞 수보다 작을 수 없습니다'); setRangeMax(rangeMin); } }}
                onFocus={(e) => e.target.select()}
                className="w-14 p-2 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-gray-900" />
            </div>
          </div>
          <div className="flex-1">
            <label className="block font-bold text-sm mb-2">둘째 수</label>
            <div className="flex gap-1 items-center">
              <input type="text" inputMode="numeric" value={opMin}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setOpMin(v === '' ? 0 : parseInt(v, 10)); }}
                onFocus={(e) => e.target.select()}
                className="w-14 p-2 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-gray-900" />
              <span className="font-bold text-gray-400 text-xs">~</span>
              <input type="text" inputMode="numeric" value={opMax}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setOpMax(v === '' ? 0 : parseInt(v, 10)); }}
                onBlur={() => { if (opMax > 0 && opMax < opMin) { showToast('뒷 수가 앞 수보다 작을 수 없습니다'); setOpMax(opMin); } }}
                onFocus={(e) => e.target.select()}
                className="w-14 p-2 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-gray-900" />
            </div>
          </div>
          <div className="flex-1">
            <label className="block font-bold text-sm mb-2">셋째 수</label>
            <div className="flex gap-1 items-center">
              <input type="text" inputMode="numeric" value={op2Min}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setOp2Min(v === '' ? 0 : parseInt(v, 10)); }}
                onFocus={(e) => e.target.select()}
                className="w-14 p-2 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-gray-900" />
              <span className="font-bold text-gray-400 text-xs">~</span>
              <input type="text" inputMode="numeric" value={op2Max}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setOp2Max(v === '' ? 0 : parseInt(v, 10)); }}
                onBlur={() => { if (op2Max > 0 && op2Max < op2Min) { showToast('뒷 수가 앞 수보다 작을 수 없습니다'); setOp2Max(op2Min); } }}
                onFocus={(e) => e.target.select()}
                className="w-14 p-2 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-gray-900" />
            </div>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400 mb-3">미리보기</p>
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
          onClick={generate}
          className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-base cursor-pointer transition-colors mt-2"
        >
          문제 생성
        </button>
      </div>
    </div>
  );
}
