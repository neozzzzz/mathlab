"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CalcPage() {
  const router = useRouter();
  const [type, setType] = useState<"add" | "sub">("sub");
  const [count, setCount] = useState(24);
  const [sheets, setSheets] = useState(1);
  const [rangeMin, setRangeMin] = useState(11);
  const [rangeMax, setRangeMax] = useState(18);
  const [opMin, setOpMin] = useState(2);
  const [opMax, setOpMax] = useState(9);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function generate() {
    if (rangeMin <= 0 || rangeMax <= 0) {
      showToast("숫자 범위를 입력해주세요");
      return;
    }
    if (opMin <= 0 || opMax <= 0) {
      showToast("연산 숫자 범위를 입력해주세요");
      return;
    }
    const params = new URLSearchParams({
      mode: "calc",
      t: type,
      c: String(count),
      s: String(sheets),
      mn: String(rangeMin),
      mx: String(rangeMax),
      omn: String(opMin),
      omx: String(opMax),
    });
    router.push(`/calc/preview?${params.toString()}`);
  }

  return (
    <div className="max-w-[600px] mx-auto p-8 relative">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-bold animate-fade-in">
          {toast}
        </div>
      )}
      <Link href="/" className="inline-block mb-4 text-sm text-gray-400 hover:text-gray-600">← 메인으로</Link>
      <h1 className="text-2xl font-black text-center mb-6">일반 연산</h1>

      <div className="bg-white rounded-2xl p-7 shadow-md">
        {/* 연산 유형 */}
        <div className="mb-5">
          <label className="block font-bold text-sm mb-2">연산 유형</label>
          <div className="flex gap-2">
            <button
              onClick={() => setType("add")}
              className={`flex-1 py-2.5 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                type === "add"
                  ? "border-gray-900 bg-[#ddd]/50 text-black"
                  : "border-gray-200 bg-white hover:border-gray-400"
              }`}
            >
              + 더하기
            </button>
            <button
              onClick={() => setType("sub")}
              className={`flex-1 py-2.5 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                type === "sub"
                  ? "border-gray-900 bg-[#ddd]/50 text-black"
                  : "border-gray-200 bg-white hover:border-gray-400"
              }`}
            >
              - 빼기
            </button>
          </div>
        </div>

        {/* 문제 수 & 장 수 */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block font-bold text-sm mb-2">문제 수 (장당)</label>
            <div className="flex gap-1.5">
              {[12, 18, 24, 36].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`flex-1 py-2.5 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                    count === n
                      ? "border-gray-900 bg-[#ddd]/50 text-black"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="block font-bold text-sm mb-2">장 수</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSheets(n)}
                  className={`flex-1 py-2.5 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                    sheets === n
                      ? "border-gray-900 bg-[#ddd]/50 text-black"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 숫자 범위 & 연산 숫자 범위 */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block font-bold text-sm mb-2">첫째 수 범위</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                inputMode="numeric"
                value={rangeMin}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setRangeMin(v === '' ? 0 : parseInt(v, 10)); }}
                onFocus={(e) => e.target.select()}
                className="w-16 p-2.5 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-gray-900"
              />
              <span className="font-bold text-gray-400">~</span>
              <input
                type="text"
                inputMode="numeric"
                value={rangeMax}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setRangeMax(v === '' ? 0 : parseInt(v, 10)); }}
                onFocus={(e) => e.target.select()}
                className="w-16 p-2.5 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block font-bold text-sm mb-2">{type === "sub" ? "빼는 수" : "더하는 수"} 범위</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                inputMode="numeric"
                value={opMin}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setOpMin(v === '' ? 0 : parseInt(v, 10)); }}
                onFocus={(e) => e.target.select()}
                className="w-16 p-2.5 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-gray-900"
              />
              <span className="font-bold text-gray-400">~</span>
              <input
                type="text"
                inputMode="numeric"
                value={opMax}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setOpMax(v === '' ? 0 : parseInt(v, 10)); }}
                onFocus={(e) => e.target.select()}
                className="w-16 p-2.5 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400 mb-3">미리보기</p>
          <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-lg font-semibold" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
            {[0, 1, 2].map((i) => {
              const a = rangeMin + i * 2;
              const b = opMin + i;
              const sign = type === "sub" ? "−" : "+";
              return (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                  <span>{a} {sign} {b} =</span>
                  <span className="border-b border-gray-300 w-8 inline-block ml-1"></span>
                </div>
              );
            })}
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
