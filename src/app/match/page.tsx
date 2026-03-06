"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Dropdown from "@/components/Dropdown";
import { trackEvent, GA_EVENTS } from "@/lib/ga";
import { encodeParams, type GeneratorParams } from "@/lib/generator";

const typeOptions: Array<["add" | "sub", string]> = [
  ["add", "+더하기"],
  ["sub", "−빼기"],
];

export default function Home() {
  const router = useRouter();
  const [type, setType] = useState<"add" | "sub">("add");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [operands, setOperands] = useState("8,9");
  const [count, setCount] = useState(8);
  const [sheets, setSheets] = useState(1);
  const [rangeMin, setRangeMin] = useState(11);
  const [rangeMax, setRangeMax] = useState(18);

  const operandList = useMemo(
    () => operands.split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => !Number.isNaN(n)),
    [operands]
  );

  const rangeReady = rangeMin > 0 && rangeMax > 0 && rangeMin <= rangeMax;
  const hasOperands = operandList.length > 0;
  const isReady = rangeReady && hasOperands && count > 0 && sheets > 0;
  const statusText = isReady ? "현재 설정으로 즉시 생성 가능합니다" : "현재 설정을 확인해 주세요";

  const sampleTop = useMemo(() => {
    if (!rangeReady) return [11, 13, 18];
    return [rangeMin, Math.min(rangeMin + 2, rangeMax), rangeMax];
  }, [rangeMin, rangeMax, rangeReady]);

  const sampleOperand = operandList[0] ?? 1;

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }

  function generate() {
    if (operandList.length === 0) {
      showToast("연산자(정답 값)를 입력해주세요");
      return;
    }

    if (!rangeReady) {
      showToast("숫자 범위를 확인해 주세요");
      return;
    }

    const params: GeneratorParams = {
      type,
      operands: operandList,
      count,
      sheets,
      rangeMin,
      rangeMax,
    };

    trackEvent(GA_EVENTS.GENERATE, {
      page: "match",
      type,
      count,
      sheets,
      range_min: rangeMin,
      range_max: rangeMax,
    });

    router.push(`/preview?${encodeParams(params)}`);
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100/80 px-4 py-8">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in">
          {toast}
        </div>
      )}

      <div className="max-w-[600px] mx-auto mb-4">
        <Link href="/" onClick={() => trackEvent(GA_EVENTS.NAV_HOME, { from: "match" })} className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold">
          <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
          <span className="ml-1 transition-all duration-150 group-hover:font-bold">메인으로</span>
        </Link>
      </div>

      <h1 className="text-2xl font-black text-slate-900 text-center mb-6 tracking-tight">짝 맞추기</h1>

      <div className="max-w-[600px] mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)] p-6 md:p-7">
        <div className="mb-4 inline-flex items-center gap-2 text-xs">
          <span
            className={`inline-flex px-3 py-1 rounded-full border ${
              isReady ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-700"
            }`}
          >
            {statusText}
          </span>
        </div>

        <div className="mb-5">
          <label className="block font-bold text-sm mb-2">연산 유형</label>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3">
            <p className="text-xs text-slate-500 font-bold mb-2">더하기/빼기</p>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setType(k)}
                  className={`w-full text-center py-2.5 px-2 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
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

        <label className="block font-bold text-sm mb-2">수 범위</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl border border-slate-200/80 bg-white p-3">
            <p className="block text-xs text-slate-500 font-bold mb-2">숫자 범위</p>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                inputMode="numeric"
                value={rangeMin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setRangeMin(v === "" ? 0 : parseInt(v, 10));
                }}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
              <span className="font-bold text-gray-400">~</span>
              <input
                type="text"
                inputMode="numeric"
                value={rangeMax}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setRangeMax(v === "" ? 0 : parseInt(v, 10));
                }}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3">
            <p className="block text-xs text-slate-500 font-bold mb-2">연산자(정답 값)</p>
            <input
              type="text"
              value={operands}
              inputMode="numeric"
              onChange={(e) => setOperands(e.target.value.replace(/[^\d,]/g, ""))}
              placeholder="예: 6,7,9"
              className="w-full p-2.5 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 bg-white"
            />
            <p className="mt-2 text-[11px] text-slate-500">예: 6,7,9 (쉼표로 여러 개 입력)</p>
          </div>
        </div>

        <label className="block font-bold text-sm mb-2">기본 설정</label>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="block text-xs text-slate-500 font-bold mb-2">문제수</p>
              <Dropdown value={count} options={[6, 8].map((n) => ({ value: n, label: `${n}문제` }))} onChange={setCount} />
            </div>
            <div>
              <p className="block text-xs text-slate-500 font-bold mb-2">장수</p>
              <Dropdown value={sheets} options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}장` }))} onChange={setSheets} />
            </div>
          </div>
        </div>

        <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
          <p className="text-xs text-slate-500 mb-3 font-medium">미리보기</p>
          <div className="relative flex items-center gap-[6px] px-2" style={{ transform: "scale(0.9)", transformOrigin: "left top" }}>
            <div
              style={{
                width: 57,
                height: 57,
                minWidth: 57,
                borderRadius: "50%",
                border: "3px solid #e91e63",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                fontWeight: 900,
                color: "#c2185b",
                marginLeft: 8,
              }}
            >
              {sampleOperand}
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-center" style={{ gap: 20 }}>
                {sampleTop.map((n, j) => {
                  const colors = ["#90caf9", "#a5d6a7", "#ffcc80"];
                  return (
                    <div key={j} className="flex flex-col items-center">
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          border: `2px solid ${colors[j]}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                        }}
                      >
                        {n}
                      </div>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", margin: "4px 0" }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "10px 0" }} />
              <div className="flex justify-center" style={{ gap: 20 }}>
                {sampleTop.map((n, j) => {
                  const colors = ["#ef9a9a", "#ce93d8", "#80cbc4"];
                  const answer = type === "sub" ? n - sampleOperand : n + sampleOperand;
                  return (
                    <div key={j} className="flex flex-col items-center">
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", margin: "4px 0" }} />
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          border: `2px solid ${colors[j]}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                        }}
                      >
                        {answer}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={generate}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-base cursor-pointer transition-colors mt-2"
        >
          문제 생성
        </button>
      </div>
    </div>
  );
}
