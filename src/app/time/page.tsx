"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Dropdown from "@/components/Dropdown";
import {
  encodeTimeParams,
  formatHoursMinutes,
  TIME_MAX_MINUTES,
  TIME_MIN_MINUTES,
  type TimeMode,
} from "@/lib/math-generator";
import { trackEvent, GA_EVENTS } from "@/lib/ga";

function NumberInput({
  value,
  onChange,
  onBlur,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  ariaLabel: string;
}) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // 포커스 밖에서 외부 값이 바뀌면(예: 최대값 교정) 표시값을 맞춘다.
  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      value={text}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        setText(digits);
        onChange(digits === "" ? 0 : parseInt(digits, 10));
      }}
      onFocus={(e) => {
        setFocused(true);
        e.currentTarget.select();
      }}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      className="w-full min-w-0 p-2.5 pr-9 border-2 border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
    />
  );
}

const MODE_OPTIONS: { value: TimeMode; label: string; sample: string }[] = [
  { value: "time_convert", label: "단위 바꾸기", sample: "1시간 36분 = □분" },
  { value: "time_compare", label: "더 긴 시간 고르기", sample: "1시간 55분 / 75분" },
  { value: "time_split", label: "60분 이용해 바꾸기", sample: "75분 = 60분 + 15분 = 1시간 □분" },
];

// 더 긴 시간 고르기는 한 장(A4)에 20문제, 두 줄로 풀어 쓰는 60분 이용해 바꾸기는 16문제까지 들어간다.
const COUNT_OPTIONS: Record<TimeMode, number[]> = {
  time_convert: [10, 16, 20, 26],
  time_compare: [10, 16, 20],
  time_split: [10, 12, 16],
};

function MinutesField({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onBlur: () => void;
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="block text-xs text-slate-500 font-bold mb-2">{label}</p>
      <div className="relative">
        <NumberInput value={value} onChange={onChange} onBlur={onBlur} ariaLabel={`${label}(분)`} />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">분</span>
      </div>
      <p className="mt-1.5 text-xs text-slate-500 text-center">= {formatHoursMinutes(value)}</p>
    </div>
  );
}

export default function TimePage() {
  const router = useRouter();
  const [mode, setMode] = useState<TimeMode>("time_convert");
  const [minMinutes, setMinMinutes] = useState(61);
  const [maxMinutes, setMaxMinutes] = useState(179);
  const [count, setCount] = useState(20);
  const [sheets, setSheets] = useState(1);
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

  function selectMode(next: TimeMode) {
    setMode(next);
    // 바꾼 유형에 없는 문제 수(예: 더 긴 시간 고르기의 26문제)는 그 유형의 최대값으로 맞춘다.
    const options = COUNT_OPTIONS[next];
    if (!options.includes(count)) setCount(options[options.length - 1]);
  }

  function normalizeRange() {
    if (maxMinutes > 0 && maxMinutes < minMinutes) {
      showToast("최대 시간이 최소 시간보다 짧을 수 없습니다");
      setMaxMinutes(minMinutes);
    }
  }

  function generate() {
    if (
      minMinutes < TIME_MIN_MINUTES ||
      maxMinutes > TIME_MAX_MINUTES ||
      minMinutes > maxMinutes
    ) {
      showToast(`시간 범위는 ${TIME_MIN_MINUTES}~${TIME_MAX_MINUTES}분 사이로 정해 주세요`);
      return;
    }
    if (minMinutes === maxMinutes && minMinutes % 60 === 0) {
      showToast("1시간, 2시간처럼 딱 떨어지는 시간만으로는 문제를 만들 수 없습니다");
      return;
    }

    const query = encodeTimeParams({ mode, count, sheets, minMinutes, maxMinutes });

    trackEvent(GA_EVENTS.GENERATE, {
      page: "time",
      type: mode,
      count,
      sheets,
      range_min: minMinutes,
      range_max: maxMinutes,
    });

    router.push(`/time/preview?${query}`);
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
          onClick={() => trackEvent(GA_EVENTS.NAV_HOME, { from: "time" })}
          className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold"
        >
          <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
          <span className="ml-1 transition-all duration-150 group-hover:font-bold">메인으로</span>
        </Link>
      </div>

      <h1 className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tight">시간</h1>
      <p className="text-center text-sm text-slate-500 mb-6">문제 생성 설정</p>

      <div className="max-w-[600px] mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)] p-6 md:p-7 space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2">문제 유형</label>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="문제 유형">
            {MODE_OPTIONS.map((option) => {
              const selected = option.value === mode;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectMode(option.value)}
                  className={`rounded-xl border-2 px-3 py-3 text-left transition-colors cursor-pointer ${
                    selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className={`block mt-1 text-xs ${selected ? "text-slate-300" : "text-slate-500"}`}>{option.sample}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">시간 범위</label>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3">
            <div className="flex gap-2 items-start">
              <MinutesField label="최소 시간" value={minMinutes} onChange={setMinMinutes} onBlur={normalizeRange} />
              <span className="font-bold text-gray-400 mt-9">~</span>
              <MinutesField label="최대 시간" value={maxMinutes} onChange={setMaxMinutes} onBlur={normalizeRange} />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {TIME_MIN_MINUTES}분(1시간)부터 {TIME_MAX_MINUTES}분(10시간)까지 정할 수 있습니다. 1시간, 2시간처럼 딱 떨어지는 시간은 문제에 나오지 않습니다.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">기본 설정</label>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 grid grid-cols-2 gap-3">
            <div>
              <p className="block text-xs text-slate-500 font-bold mb-2">문제수</p>
              <Dropdown
                value={count}
                options={COUNT_OPTIONS[mode].map((n) => ({ value: n, label: `${n}문제` }))}
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
