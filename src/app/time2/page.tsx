"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Dropdown from "@/components/Dropdown";
import {
  encodeTime2Params,
  normalizeTime2Formats,
  splitTime2Counts,
  time2CountOptions,
  TIME2_FORMATS,
  type Time2Format,
} from "@/lib/math-generator";
import { trackEvent, GA_EVENTS } from "@/lib/ga";

// 교재 수학 2-2 「⑥ 걸린 시간을 알아볼까요」 확인 문제의 네 가지 형식.
const FORMAT_OPTIONS: { value: Time2Format; label: string; sample: string }[] = [
  { value: "convert", label: "단위 바꾸기", sample: "1시간 20분 = □분 / 100분 = □시간 □분" },
  { value: "schedule", label: "시간표 보고 걸린 시간", sample: "9:00~10:20, 쉬는 시간 10분, 10:30~11:40" },
  { value: "clock", label: "시계 보고 걸린 시간", sample: "시작한 시각 ⇨ 끝난 시각 시계" },
  { value: "end", label: "끝난 시각 구하기", sample: "12시 45분에 시작해 40분 동안 → □시 □분" },
];

const FORMAT_LABEL = Object.fromEntries(FORMAT_OPTIONS.map((o) => [o.value, o.label])) as Record<Time2Format, string>;

export default function Time2Page() {
  const router = useRouter();
  const [formats, setFormats] = useState<Time2Format[]>([...TIME2_FORMATS]);
  const [count, setCount] = useState(6);
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

  function toggleFormat(format: Time2Format) {
    const next = formats.includes(format) ? formats.filter((f) => f !== format) : [...formats, format];
    if (next.length === 0) {
      showToast("형식을 하나 이상 골라 주세요");
      return;
    }
    const normalized = normalizeTime2Formats(next);
    setFormats(normalized);
    // 시계 문제처럼 큰 문제만 고르면 한 장에 8문제가 들어가지 않으므로, 넘지 않는 가장 큰 수로 맞춘다.
    const options = time2CountOptions(normalized);
    if (!options.includes(count)) setCount(options.filter((n) => n <= count).pop() ?? options[0]);
  }

  const counts = splitTime2Counts(count, formats);
  const composition = formats
    .filter((f) => counts[f] > 0)
    .map((f) => `${FORMAT_LABEL[f]} ${counts[f]}`)
    .join(" · ");

  function generate() {
    const query = encodeTime2Params({ formats, count, sheets });
    trackEvent(GA_EVENTS.GENERATE, { page: "time2", formats: formats.join(","), count, sheets });
    router.push(`/time2/preview?${query}`);
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
          onClick={() => trackEvent(GA_EVENTS.NAV_HOME, { from: "time2" })}
          className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold"
        >
          <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
          <span className="ml-1 transition-all duration-150 group-hover:font-bold">메인으로</span>
        </Link>
      </div>

      <h1 className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tight">시간 2</h1>
      <p className="text-center text-sm text-slate-500 mb-6">걸린 시간 알아보기 · 문제 생성 설정</p>

      <div className="max-w-[600px] mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)] p-6 md:p-7 space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2">문제 형식</label>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="문제 형식">
            {FORMAT_OPTIONS.map((option) => {
              const selected = formats.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleFormat(option.value)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    selected ? "border-slate-900 bg-slate-50 text-slate-900" : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    <span
                      aria-hidden
                      className={`inline-flex items-center justify-center w-4 h-4 rounded border text-[10px] leading-none ${
                        selected ? "bg-slate-900 border-slate-900 text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {selected ? "✓" : ""}
                    </span>
                    {option.label}
                  </span>
                  <span className="block mt-1 text-xs text-slate-500">{option.sample}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            고른 형식을 한 장에 차례로 냅니다. 이번 구성: {composition}
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">기본 설정</label>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 grid grid-cols-2 gap-3">
            <div>
              <p className="block text-xs text-slate-500 font-bold mb-2">문제수</p>
              <Dropdown
                value={count}
                options={time2CountOptions(formats).map((n) => ({ value: n, label: `${n}문제` }))}
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
