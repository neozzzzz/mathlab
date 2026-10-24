"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Dropdown from "@/components/Dropdown";
import { encodeCalcParams, type CalcType } from "@/lib/math-generator";
import { trackEvent, GA_EVENTS } from "@/lib/ga";

function NumberInput({
  value,
  onChange,
  onBlur,
  onFocus,
}: {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  onFocus?: (el: HTMLInputElement) => void;
}) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // 포커스 밖에서 외부 값이 바뀌면(예: normalizeRange 교정) 표시값을 맞춘다.
  // 편집 중에는 빈 문자열을 그대로 두어 지우고 다시 입력할 수 있게 한다.
  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        setText(digits);
        onChange(digits === "" ? 0 : parseInt(digits, 10));
      }}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e.currentTarget);
      }}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      className="w-full flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
    />
  );
}

export default function VerticalPage() {
  const router = useRouter();
  const [type] = useState<CalcType>("mixed_addition");
  const [count, setCount] = useState(24);
  const [sheets, setSheets] = useState(1);
  const [rangeMin, setRangeMin] = useState(11);
  const [rangeMax, setRangeMax] = useState(59);
  const [opMin, setOpMin] = useState(11);
  const [opMax, setOpMax] = useState(39);
  const [answerAddMin, setAnswerAddMin] = useState(20);
  const [answerAddMax, setAnswerAddMax] = useState(99);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    setToast(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  function normalizeRange(label: string, min: number, max: number, setMax: (value: number) => void) {
    if (max > 0 && max < min) {
      showToast(`${label} 최대가 최소보다 작을 수 없습니다`);
      setMax(min);
    }
  }

  const sampleProblems = [
    { a: rangeMin, b: opMin },
    { a: Math.round((rangeMin + rangeMax) / 2), b: Math.round((opMin + opMax) / 2) },
    { a: rangeMax, b: opMax },
  ];

  function generate() {
    const rangeChecks = [
      { label: "윗줄 수", min: rangeMin, max: rangeMax },
      { label: "아랫줄 수", min: opMin, max: opMax },
    ];
    for (const { label, min, max } of rangeChecks) {
      if (min < 10 || max > 99 || min > max) {
        showToast(`${label} 범위는 10~99 사이, 최소가 최대보다 클 수 없습니다`);
        return;
      }
    }

    if (count <= 0 || sheets <= 0) {
      showToast("문제수와 장수는 1 이상이어야 합니다");
      return;
    }

    if (answerAddMin <= 0 || answerAddMax <= 0 || answerAddMin > answerAddMax) {
      showToast("결과값 범위를 다시 확인해주세요");
      return;
    }

    const query = encodeCalcParams({
      type,
      count,
      sheets,
      rangeMin,
      rangeMax,
      opMin,
      opMax,
      answerAddMin,
      answerAddMax,
      layout: "a",
    });

    trackEvent(GA_EVENTS.GENERATE, {
      page: "vertical",
      type,
      count,
      sheets,
      range_min: rangeMin,
      range_max: rangeMax,
    });

    router.push(`/vertical/preview?${query}`);
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100/80 px-4 py-8">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in">
          {toast}
        </div>
      )}

      <div className="max-w-[600px] mx-auto mb-4">
        <Link
          href="/"
          onClick={() => trackEvent(GA_EVENTS.NAV_HOME, { from: "vertical" })}
          className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold"
        >
          <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
          <span className="ml-1 transition-all duration-150 group-hover:font-bold">메인으로</span>
        </Link>
      </div>

      <h1 className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tight">사칙 연산 (세로셈)</h1>
      <p className="text-center text-sm text-slate-500 mb-6">문제 생성 설정</p>

      <div className="max-w-[600px] mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)] p-6 md:p-7 space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2">세로셈 범위</label>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 space-y-3">
            <div>
              <p className="block text-xs text-slate-500 font-bold mb-2">윗줄 수 범위</p>
              <div className="flex gap-2 items-center">
                <NumberInput
                  value={rangeMin}
                  onChange={setRangeMin}
                  onBlur={() => normalizeRange("윗줄 수", rangeMin, rangeMax, setRangeMax)}
                  onFocus={(el) => el.select()}
                />
                <span className="font-bold text-gray-400">~</span>
                <NumberInput
                  value={rangeMax}
                  onChange={setRangeMax}
                  onBlur={() => normalizeRange("윗줄 수", rangeMin, rangeMax, setRangeMax)}
                  onFocus={(el) => el.select()}
                />
              </div>
            </div>

            <div>
              <p className="block text-xs text-slate-500 font-bold mb-2">아랫줄 수 범위</p>
              <div className="flex gap-2 items-center">
                <NumberInput
                  value={opMin}
                  onChange={setOpMin}
                  onBlur={() => normalizeRange("아랫줄 수", opMin, opMax, setOpMax)}
                  onFocus={(el) => el.select()}
                />
                <span className="font-bold text-gray-400">~</span>
                <NumberInput
                  value={opMax}
                  onChange={setOpMax}
                  onBlur={() => normalizeRange("아랫줄 수", opMin, opMax, setOpMax)}
                  onFocus={(el) => el.select()}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">결과값 범위</label>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3">
            <div className="flex gap-2 items-center">
              <NumberInput
                value={answerAddMin}
                onChange={setAnswerAddMin}
                onBlur={() => normalizeRange("결과값", answerAddMin, answerAddMax, setAnswerAddMax)}
                onFocus={(el) => el.select()}
              />
              <span className="font-bold text-gray-400">~</span>
              <NumberInput
                value={answerAddMax}
                onChange={setAnswerAddMax}
                onBlur={() => normalizeRange("결과값", answerAddMin, answerAddMax, setAnswerAddMax)}
                onFocus={(el) => el.select()}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">기본 설정</label>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 grid grid-cols-2 gap-3">
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

        <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
          <p className="text-xs text-orange-700 font-bold mb-3">샘플 미리보기</p>
          <div className="space-y-3 text-sm text-slate-700">
            {sampleProblems.map((problem, index) => (
              <div key={`${problem.a}-${problem.b}-${index}`} className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold mt-0.5">
                  {index + 1}
                </span>
                <div className="font-mono text-base leading-tight">
                  <div className="text-right">{problem.a}</div>
                  <div className="text-right">+ {problem.b}</div>
                  <div className="border-t-2 border-slate-700 mt-1 pt-1 text-right">□ □ □</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-base cursor-pointer transition-colors"
        >
          문제 생성
        </button>
      </div>
    </div>
  );
}
