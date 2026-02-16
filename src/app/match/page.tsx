"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { encodeParams, type GeneratorParams } from "@/lib/generator";

export default function Home() {
  const router = useRouter();
  const [type, setType] = useState<"add" | "sub" | null>(null);
  const [operands, setOperands] = useState("8,9");
  const [count, setCount] = useState(8);
  const [sheets, setSheets] = useState(2);
  const [rangeMin, setRangeMin] = useState(11);
  const [rangeMax, setRangeMax] = useState(18);

  const generate = () => {
    if (!type) {
      alert("연산 유형을 선택해주세요");
      return;
    }
    const ops = operands
      .split(",")
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));
    if (ops.length === 0) {
      alert("연산 숫자를 입력해주세요");
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
    <div className="max-w-[600px] mx-auto p-8">
      <Link href="/" className="inline-block mb-4 text-sm text-gray-400 hover:text-gray-600">← 메인으로</Link>
      <h1 className="text-2xl font-black text-center mb-6">짝 맞추기</h1>

      <div className="bg-white rounded-2xl p-7 shadow-md">
        {/* 연산 유형 */}
        <div className="mb-5">
          <label className="block font-bold text-sm mb-2">연산 유형</label>
          <div className="flex gap-2">
            <button
              onClick={() => setType("sub")}
              className={`flex-1 py-3 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                type === "sub"
                  ? "border-orange-500 bg-orange-50 text-orange-800"
                  : "border-gray-200 bg-white hover:border-orange-300"
              }`}
            >
              ➖ 빼기
            </button>
            <button
              onClick={() => setType("add")}
              className={`flex-1 py-3 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                type === "add"
                  ? "border-orange-500 bg-orange-50 text-orange-800"
                  : "border-gray-200 bg-white hover:border-orange-300"
              }`}
            >
              ➕ 더하기
            </button>
          </div>
        </div>

        {/* 연산 숫자 */}
        <div className="mb-5">
          <label className="block font-bold text-sm mb-2">연산 숫자 (쉼표로 구분)</label>
          <input
            type="text"
            value={operands}
            onChange={(e) => setOperands(e.target.value)}
            placeholder="예: 6,7 또는 8,9"
            className="w-full p-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          />
          <p className="text-xs text-gray-400 mt-1">빼기: 빼는 수 / 더하기: 더하는 수</p>
        </div>

        {/* 문제 수 & 장 수 */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block font-bold text-sm mb-2">문제 수 (장당)</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
            >
              <option value={6}>6문제</option>
              <option value={8}>8문제</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block font-bold text-sm mb-2">장 수</label>
            <select
              value={sheets}
              onChange={(e) => setSheets(Number(e.target.value))}
              className="w-full p-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}장
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 숫자 범위 */}
        <div className="mb-5">
          <label className="block font-bold text-sm mb-2">숫자 범위</label>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              value={rangeMin}
              onChange={(e) => setRangeMin(Number(e.target.value))}
              min={2}
              max={50}
              className="flex-1 p-2.5 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-orange-500"
            />
            <span className="font-bold">~</span>
            <input
              type="number"
              value={rangeMax}
              onChange={(e) => setRangeMax(Number(e.target.value))}
              min={2}
              max={50}
              className="flex-1 p-2.5 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-orange-500"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">윗줄에 표시되는 숫자의 범위</p>
        </div>

        {/* 생성 버튼 */}
        <button
          onClick={generate}
          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-base cursor-pointer transition-colors mt-2"
        >
          📝 문제 생성
        </button>
      </div>
    </div>
  );
}
