"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Dropdown({ value, options, onChange }: { value: number; options: { value: number; label: string }[]; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2.5 px-4 border-2 border-gray-200 rounded-lg font-bold text-sm bg-white cursor-pointer focus:outline-none focus:border-gray-900 transition-colors"
      >
        <span>{selected?.label}</span>
        <span className={`text-gray-400 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {options.map((o) => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`py-2.5 px-4 text-sm font-bold cursor-pointer transition-colors ${
                value === o.value
                  ? "bg-gray-900 text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { encodeParams, type GeneratorParams } from "@/lib/generator";

export default function Home() {
  const router = useRouter();
  const [type, setType] = useState<"add" | "sub" | null>("add");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }
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
    router.push(`/preview?${encodeParams(params)}`);
  };

  return (
    <div className="max-w-[600px] mx-auto p-8 relative">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-bold animate-fade-in">
          {toast}
        </div>
      )}
      <Link href="/" className="inline-block mb-4 text-sm text-gray-400 hover:text-gray-600">← 메인으로</Link>
      <h1 className="text-2xl font-black text-center mb-6">짝 맞추기</h1>

      <div className="bg-white rounded-2xl p-7 shadow-md">
        {/* 연산 유형 */}
        <div className="mb-5">
          <label className="block font-bold text-sm mb-2">연산 유형</label>
          <div className="flex gap-2">
            <button
              onClick={() => setType("add")}
              className={`flex-1 py-3 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                type === "add"
                  ? "border-gray-900 bg-[#ddd]/50 text-black"
                  : "border-gray-200 bg-white hover:border-gray-400"
              }`}
            >
              + 더하기
            </button>
            <button
              onClick={() => setType("sub")}
              className={`flex-1 py-3 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
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
            <Dropdown
              value={count}
              options={[6, 8].map(n => ({ value: n, label: `${n}문제` }))}
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

        {/* 숫자 범위 & 계산 결과 값 */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block font-bold text-sm mb-2">숫자 범위</label>
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
            <label className="block font-bold text-sm mb-2">계산 결과 값</label>
            <input
              type="text"
              value={operands}
              inputMode="numeric"
              onChange={(e) => setOperands(e.target.value.replace(/[^\d,]/g, ''))}
              placeholder="예: 6,7"
              className="w-full p-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900"
            />
          </div>
        </div>

        {/* 미리보기 카드 */}
        {(
          <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-400 mb-3">미리보기</p>
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
        )}

        {/* 생성 버튼 */}
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
