"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Dropdown from "@/components/Dropdown";
import { trackEvent, GA_EVENTS } from "@/lib/ga";
import { encodeCalcParams, encodeScreenshotAdditionParams, type CalcType, type ScreenshotAdditionParams } from "@/lib/math-generator";

type CalcMode = "standard" | "screenshot_addition";

type AnswerRangeType = {
  min: number;
  max: number;
};

function parseNumericInput(v: string) {
  const raw = v.replace(/\D/g, "");
  return raw === "" ? 0 : parseInt(raw, 10);
}

function NumberInput({
  value,
  onChange,
  onBlur,
  disabled,
  onFocus,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  onFocus?: (el: HTMLInputElement) => void;
  className?: string;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(parseNumericInput(e.target.value))}
      onBlur={onBlur}
      onFocus={(e) => onFocus?.(e.currentTarget)}
      disabled={disabled}
      className={
        className ??
        "w-full flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-slate-400 bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
      }
    />
  );
}

function RangePair({
  title,
  left,
  right,
  disabledLeft,
  disabledRight,
  leftTitleClassName,
  rightTitleClassName,
  onLeftChange,
  onRightChange,
  onValidate,
  onFocus,
}: {
  title: string;
  left: number;
  right: number;
  disabledLeft?: boolean;
  disabledRight?: boolean;
  leftTitleClassName?: string;
  rightTitleClassName?: string;
  onLeftChange: (value: number) => void;
  onRightChange: (value: number) => void;
  onValidate: (left: number, right: number, label: string) => void;
  onFocus?: (el: HTMLInputElement) => void;
}) {
  return (
    <div>
      <p className={`font-bold text-sm mb-2 ${leftTitleClassName ?? ""}`}>{title}</p>
      <div className="flex gap-2">
        <NumberInput
          value={left}
          onChange={onLeftChange}
          onBlur={() => onValidate(left, right, "min")}
          onFocus={onFocus}
          disabled={disabledLeft}
        />
        <span className="font-bold text-gray-400">~</span>
        <NumberInput
          value={right}
          onChange={onRightChange}
          onBlur={() => onValidate(left, right, "max")}
          onFocus={onFocus}
          disabled={disabledRight}
        />
      </div>
    </div>
  );
}

function EmptyBox({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center border-b-2 border-gray-900 border-dotted h-[1.4em] min-w-[2.8em] ${className}`}>
      
    </span>
  );
}

export default function CalcPage() {
  const router = useRouter();
  const [mode, setMode] = useState<CalcMode>("standard");
  const [type, setType] = useState<CalcType>("add");

  const [count, setCount] = useState(24);
  const [standardCount, setStandardCount] = useState(24);
  const [sheets, setSheets] = useState(1);
  const [rangeMin, setRangeMin] = useState(11);
  const [rangeMax, setRangeMax] = useState(18);
  const [opMin, setOpMin] = useState(2);
  const [opMax, setOpMax] = useState(9);

  const [answerMin, setAnswerMin] = useState(1);
  const [answerMax, setAnswerMax] = useState(99);

  const [answerAddMin, setAnswerAddMin] = useState(1);
  const [answerAddMax, setAnswerAddMax] = useState(99);
  const [answerSubMin, setAnswerSubMin] = useState(1);
  const [answerSubMax, setAnswerSubMax] = useState(99);
  const [answerMulMin, setAnswerMulMin] = useState(1);
  const [answerMulMax, setAnswerMulMax] = useState(99);
  const [answerDivMin, setAnswerDivMin] = useState(1);
  const [answerDivMax, setAnswerDivMax] = useState(99);

  const [gugudanTables, setGugudanTables] = useState<number[]>([]);

  const [layout, setLayout] = useState<"a" | "b">("a");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [screenshotFirstMin, setScreenshotFirstMin] = useState(12);
  const [screenshotFirstMax, setScreenshotFirstMax] = useState(98);
  const [screenshotSecondMin, setScreenshotSecondMin] = useState(12);
  const [screenshotSecondMax, setScreenshotSecondMax] = useState(98);

  const isScreenshotMode = mode === "screenshot_addition";

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  const countOptions = [12, 18, 24, 36];

  useEffect(() => {
    if (mode === "screenshot_addition") {
      setCount(5);
      return;
    }

    setCount(standardCount);
  }, [mode, standardCount]);
  const isArithmeticResultRange =
    mode === "standard" &&
    (type === "add" || type === "sub" || type === "add_sub" || type === "mul" || type === "div" || type === "mul_div" || type === "mixed_addition");

  const screenshotSampleLeftRoundedA = Math.floor(screenshotFirstMin / 10) * 10;
  const screenshotSampleRightRoundedB = Math.ceil(screenshotSecondMin / 10) * 10;

  const isMixedAddSub = type === "add_sub";
  const isMixedMulDiv = type === "mul_div";
  const isMixedAddition = type === "mixed_addition";
  const isAdd = type === "add";
  const isSub = type === "sub";
  const isMul = type === "mul";
  const isDiv = type === "div";
  const isGugudanActive = mode === "standard" && isMul && gugudanTables.length > 0;

  function toggleGugudanTable(table: number) {
    setGugudanTables((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table].sort((a, b) => a - b)
    );
  }

  function validateRangePair(label: string, range: AnswerRangeType) {
    if (range.max > 0 && range.max < range.min) {
      showToast(`${label} 최대가 최소보다 작을 수 없습니다`);
      return { ...range, max: range.min };
    }
    return range;
  }

  function validatePairRange(
    label: string,
    range: AnswerRangeType,
    counterpart?: AnswerRangeType
  ) {
    if (range.max > 0 && range.max < range.min) {
      showToast(`${label} 최대가 최소보다 작을 수 없습니다`);
      return { ...counterpart, max: range.min };
    }
    return range;
  }

  function normalizeRangeOnBlur(minName: "range" | "op" | "s1" | "s2") {
    if (minName === "range") {
      if (rangeMax > 0 && rangeMax < rangeMin) {
        showToast("뒷 수가 앞 수보다 작을 수 없습니다");
        setRangeMax(rangeMin);
      }
      return;
    }

    if (minName === "op") {
      if (opMax > 0 && opMax < opMin) {
        showToast("뒷 수가 앞 수보다 작을 수 없습니다");
        setOpMax(opMin);
      }
      return;
    }

    if (minName === "s1") {
      if (screenshotFirstMax > 0 && screenshotFirstMax < screenshotFirstMin) {
        showToast("뒷 수가 앞 수보다 작을 수 없습니다");
        setScreenshotFirstMax(screenshotFirstMin);
      }
      return;
    }

    if (minName === "s2") {
      if (screenshotSecondMax > 0 && screenshotSecondMax < screenshotSecondMin) {
        showToast("뒷 수가 앞 수보다 작을 수 없습니다");
        setScreenshotSecondMax(screenshotSecondMin);
      }
    }
  }

  function validateScreenshotRange(v1: number, v2: number) {
    if (v1 < 10 || v1 > 99 || v2 < 10 || v2 > 99) {
      showToast("두 자리 수 범위는 10~99로 입력해 주세요");
      return false;
    }
    return true;
  }

  function generate() {
    if (mode === "screenshot_addition") {
      if (!validateScreenshotRange(screenshotFirstMin, screenshotFirstMax) || !validateScreenshotRange(screenshotSecondMin, screenshotSecondMax)) {
        return;
      }
      if (sheets <= 0) {
        showToast("문제수/장수는 1 이상이어야 합니다");
        return;
      }

      const params: ScreenshotAdditionParams = {
        mode: "screenshot_addition",
        count: 5,
        sheets,
        firstMin: screenshotFirstMin,
        firstMax: screenshotFirstMax,
        secondMin: screenshotSecondMin,
        secondMax: screenshotSecondMax,
      };

      const query = encodeScreenshotAdditionParams(params);
      trackEvent(GA_EVENTS.GENERATE, {
        page: "calc",
        type: "screenshot_addition",
        count: 5,
        sheets,
        range_min: screenshotFirstMin,
        range_max: screenshotFirstMax,
      });
      router.push(`/calc/preview?${query}`);
      return;
    }

    if (rangeMin <= 0 || rangeMax <= 0) {
      showToast("숫자 범위를 입력해주세요");
      return;
    }

    if (opMin <= 0 || opMax <= 0) {
      showToast("연산 숫자 범위를 입력해주세요");
      return;
    }

    if (!isMixedAddSub && !isMixedMulDiv && !isArithmeticResultRange) {
      showToast("지원하지 않는 연산 유형입니다");
      return;
    }

    if (isMixedAddition) {
      if (rangeMin < 10 || rangeMax > 99 || opMin < 10 || opMax > 99 || opMin > opMax || rangeMin > rangeMax) {
        showToast("혼합 덧셈은 두 자리 수 범위로 10~99 내에서 입력해주세요");
        return;
      }
      if (answerAddMin <= 0 || answerAddMax <= 0) {
        showToast("더하기 결과값 범위를 입력해주세요");
        return;
      }
      if (answerAddMax < answerAddMin) {
        showToast("더하기 결과값 최소가 최대보다 클 수 없습니다");
        return;
      }
    } else if (isMixedAddSub) {
      if (answerAddMin <= 0 || answerAddMax <= 0 || answerSubMin <= 0 || answerSubMax <= 0) {
        showToast("혼합의 결과값 범위를 입력해주세요");
        return;
      }
      if (answerAddMax < answerAddMin) {
        showToast("더하기 결과값 최소가 최대보다 클 수 없습니다");
        return;
      }
      if (answerSubMax < answerSubMin) {
        showToast("빼기 결과값 최소가 최대보다 클 수 없습니다");
        return;
      }
    } else if (isMixedMulDiv) {
      if (answerMulMin <= 0 || answerMulMax <= 0 || answerDivMin <= 0 || answerDivMax <= 0) {
        showToast("혼합의 결과값 범위를 입력해주세요");
        return;
      }
      if (answerMulMax < answerMulMin) {
        showToast("곱하기 결과값 최소가 최대보다 클 수 없습니다");
        return;
      }
      if (answerDivMax < answerDivMin) {
        showToast("나누기 결과값 최소가 최대보다 클 수 없습니다");
        return;
      }
    } else if (isAdd) {
      if (answerAddMin <= 0 || answerAddMax <= 0) {
        showToast("더하기 결과값 범위를 입력해주세요");
        return;
      }
      if (answerAddMax < answerAddMin) {
        showToast("더하기 결과값 최소가 최대보다 클 수 없습니다");
        return;
      }
    } else if (isSub) {
      if (answerSubMin <= 0 || answerSubMax <= 0) {
        showToast("빼기 결과값 범위를 입력해주세요");
        return;
      }
      if (answerSubMax < answerSubMin) {
        showToast("빼기 결과값 최소가 최대보다 클 수 없습니다");
        return;
      }
    } else if (isMul && !isGugudanActive) {
      if (answerMulMin <= 0 || answerMulMax <= 0) {
        showToast("곱하기 결과값 범위를 입력해주세요");
        return;
      }
      if (answerMulMax < answerMulMin) {
        showToast("곱하기 결과값 최소가 최대보다 클 수 없습니다");
        return;
      }
    } else if (isDiv) {
      if (answerDivMin <= 0 || answerDivMax <= 0) {
        showToast("나누기 결과값 범위를 입력해주세요");
        return;
      }
      if (answerDivMax < answerDivMin) {
        showToast("나누기 결과값 최소가 최대보다 클 수 없습니다");
        return;
      }
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
      layout,
    });

    if (isMixedAddSub) {
      params.set("amnA", String(answerAddMin));
      params.set("amxA", String(answerAddMax));
      params.set("amnS", String(answerSubMin));
      params.set("amxS", String(answerSubMax));
    } else if (isMixedMulDiv) {
      params.set("amnM", String(answerMulMin));
      params.set("amxM", String(answerMulMax));
      params.set("amnD", String(answerDivMin));
      params.set("amxD", String(answerDivMax));
    } else if (isAdd) {
      params.set("amn", String(answerAddMin));
      params.set("amx", String(answerAddMax));
    } else if (isSub) {
      params.set("amn", String(answerSubMin));
      params.set("amx", String(answerSubMax));
    } else if (isMul) {
      params.set("amn", String(answerMulMin));
      params.set("amx", String(answerMulMax));
    } else if (isDiv) {
      params.set("amn", String(answerDivMin));
      params.set("amx", String(answerDivMax));
    } else if (isArithmeticResultRange) {
      params.set("amn", String(answerMin));
      params.set("amx", String(answerMax));
    }

    trackEvent(GA_EVENTS.GENERATE, { page: "calc", type, count, sheets, range_min: rangeMin, range_max: rangeMax, layout });
    router.push(`/calc/preview?${encodeCalcParams({
      type,
      count,
      sheets,
      rangeMin,
      rangeMax,
      opMin,
      opMax,
      layout,
      answerMin: isAdd || isMixedAddition ? answerAddMin : isSub ? answerSubMin : isMul ? answerMulMin : isDiv ? answerDivMin : undefined,
      answerMax: isAdd || isMixedAddition ? answerAddMax : isSub ? answerSubMax : isMul ? answerMulMax : isDiv ? answerDivMax : undefined,
      answerAddMin,
      answerAddMax,
      answerSubMin,
      answerSubMax,
      answerMulMin,
      answerMulMax,
      answerDivMin,
      answerDivMax,
      gugudan: isGugudanActive ? gugudanTables : undefined,
    })}`);
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100/80 px-4 py-8">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in">
          {toast}
        </div>
      )}
      <div className="max-w-[600px] mx-auto mb-4">
        <Link href="/" onClick={() => trackEvent(GA_EVENTS.NAV_HOME, { from: "calc" })} className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold">
          <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
          <span className="ml-1 transition-all duration-150 group-hover:font-bold">메인으로</span>
        </Link>
      </div>
      <h1 className="text-2xl font-black text-slate-900 text-center mb-6 tracking-tight">사칙 연산</h1>

      <div className="max-w-[600px] mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)] p-6 md:p-7">
        <div className="mb-5">
          <label className="block font-bold text-sm mb-2">문제 유형</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-slate-200/80 bg-white p-3">
            <button
              type="button"
              onClick={() => setMode("standard")}
              className={`w-full text-center py-2.5 px-2 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                mode === "standard" ? "border-slate-900 bg-slate-900/5 text-slate-900" : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              기본 사칙연산
            </button>
            <button
              type="button"
              onClick={() => setMode("screenshot_addition")}
              className={`w-full text-center py-2.5 px-2 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                mode === "screenshot_addition" ? "border-slate-900 bg-slate-900/5 text-slate-900" : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              고급 사칙연산
            </button>
          </div>
        </div>

        {mode === "standard" ? (
          <>
            <label className="block text-sm font-bold mb-2">연산 유형</label>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 mb-5">
              <p className="text-xs text-slate-500 font-bold mb-2">더하기/빼기</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                {([
                  ["add", "+더하기"],
                  ["sub", "−빼기"],
                  ["add_sub", "혼합"],
                ] as [CalcType, string][]).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setType(k)}
                    className={`w-full text-center py-2.5 px-2 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                      type === k ? "border-slate-900 bg-slate-900/5 text-slate-900" : "border-slate-200 bg-white hover:border-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-bold mb-2">곱하기/나누기</p>
              <div className="grid grid-cols-3 gap-2">
                {([ ["mul", "×곱하기"], ["div", "÷나누기"], ["mul_div", "혼합"] ] as [CalcType, string][]).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setType(k)}
                    className={`w-full text-center py-2.5 px-2 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                      type === k ? "border-slate-900 bg-slate-900/5 text-slate-900" : "border-slate-200 bg-white hover:border-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {isMul && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500 font-bold">구구단 선택 (선택 시 해당 단만 출제)</p>
                    {gugudanTables.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setGugudanTables([])}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        선택 해제
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {[2, 3, 4, 5, 6, 7, 8, 9].map((table) => (
                      <button
                        key={table}
                        type="button"
                        onClick={() => toggleGugudanTable(table)}
                        className={`py-2.5 border-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${
                          gugudanTables.includes(table)
                            ? "border-slate-900 bg-slate-900/5 text-slate-900"
                            : "border-slate-200 bg-white hover:border-slate-400"
                        }`}
                      >
                        {table}단
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {gugudanTables.length > 0
                      ? "선택한 단 × 1~9 문제를 문제 수에 맞춰 출제합니다. (아래 수 범위·결과값 설정은 무시됩니다)"
                      : "단을 선택하면 해당 구구단만 출제합니다. 선택하지 않으면 아래 수 범위로 문제를 만듭니다."}
                  </p>
                </div>
              )}
            </div>

            <label className="block text-sm font-bold mb-2">수 범위</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                <p className="block text-xs text-slate-500 font-bold mb-2">첫째 수 범위</p>
                <div className="flex gap-2 items-center">
                  <NumberInput
                    value={rangeMin}
                    onChange={setRangeMin}
                    onBlur={() => normalizeRangeOnBlur("range")}
                    onFocus={(e) => e.select()}
                  />
                  <span className="font-bold text-gray-400">~</span>
                  <NumberInput
                    value={rangeMax}
                    onChange={setRangeMax}
                    onBlur={() => normalizeRangeOnBlur("range")}
                    onFocus={(e) => e.select()}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                <p className="block text-xs text-slate-500 font-bold mb-2">둘째 수 범위</p>
                <div className="flex gap-2 items-center">
                  <NumberInput
                    value={opMin}
                    onChange={setOpMin}
                    onBlur={() => normalizeRangeOnBlur("op")}
                    onFocus={(e) => e.select()}
                  />
                  <span className="font-bold text-gray-400">~</span>
                  <NumberInput
                    value={opMax}
                    onChange={setOpMax}
                    onBlur={() => normalizeRangeOnBlur("op")}
                    onFocus={(e) => e.select()}
                  />
                </div>
              </div>
            </div>

            {isGugudanActive ? null : isArithmeticResultRange ? (
              <div className="mb-5 transition-opacity opacity-100 space-y-4">
                {isMixedAddSub ? (
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                    <p className="text-xs text-slate-500 font-bold mb-2">더하기/빼기 결과값 범위</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <RangePair
                        title="더하기 결과값 범위"
                        left={answerAddMin}
                        right={answerAddMax}
                        disabledLeft={isSub}
                        disabledRight={isSub}
                        leftTitleClassName={isSub ? "text-gray-400" : ""}
                        rightTitleClassName={isSub ? "text-gray-400" : ""}
                        onLeftChange={setAnswerAddMin}
                        onRightChange={setAnswerAddMax}
                        onValidate={(l, r) => {
                          if (r > 0 && r < l) {
                            showToast("더하기 결과값 최대가 최소보다 작을 수 없습니다");
                            setAnswerAddMax(l);
                          }
                        }}
                        onFocus={(el) => el.select()}
                      />
                      <RangePair
                        title="빼기 결과값 범위"
                        left={answerSubMin}
                        right={answerSubMax}
                        disabledLeft={isAdd}
                        disabledRight={isAdd}
                        leftTitleClassName={isAdd ? "text-gray-400" : ""}
                        rightTitleClassName={isAdd ? "text-gray-500" : ""}
                        onLeftChange={setAnswerSubMin}
                        onRightChange={setAnswerSubMax}
                        onValidate={(l, r) => {
                          if (r > 0 && r < l) {
                            showToast("빼기 결과값 최대가 최소보다 작을 수 없습니다");
                            setAnswerSubMax(l);
                          }
                        }}
                        onFocus={(el) => el.select()}
                      />
                    </div>
                  </div>
                ) : isMixedMulDiv ? (
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                    <p className="text-xs text-slate-500 font-bold mb-2">곱하기/나누기 결과값 범위</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <RangePair
                        title="곱하기 결과값 범위"
                        left={answerMulMin}
                        right={answerMulMax}
                        onLeftChange={setAnswerMulMin}
                        onRightChange={setAnswerMulMax}
                        onValidate={(l, r) => {
                          if (r > 0 && r < l) {
                            showToast("곱하기 결과값 최대가 최소보다 작을 수 없습니다");
                            setAnswerMulMax(l);
                          }
                        }}
                        onFocus={(el) => el.select()}
                      />
                      <RangePair
                        title="나누기 결과값 범위"
                        left={answerDivMin}
                        right={answerDivMax}
                        onLeftChange={setAnswerDivMin}
                        onRightChange={setAnswerDivMax}
                        onValidate={(l, r) => {
                          if (r > 0 && r < l) {
                            showToast("나누기 결과값 최대가 최소보다 작을 수 없습니다");
                            setAnswerDivMax(l);
                          }
                        }}
                        onFocus={(el) => el.select()}
                      />
                    </div>
                  </div>
                ) : type === "add" || type === "sub" || isMixedAddition ? (
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                    <p className="text-xs text-slate-500 font-bold mb-2">더하기/빼기 결과값 범위</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <RangePair
                        title="더하기 결과값 범위"
                        left={answerAddMin}
                        right={answerAddMax}
                        disabledLeft={isSub}
                        disabledRight={isSub}
                        leftTitleClassName={isSub ? "text-gray-400" : ""}
                        rightTitleClassName={isSub ? "text-gray-400" : ""}
                        onLeftChange={setAnswerAddMin}
                        onRightChange={setAnswerAddMax}
                        onValidate={(l, r) => {
                          if (r > 0 && r < l) {
                            showToast("더하기 결과값 최대가 최소보다 작을 수 없습니다");
                            setAnswerAddMax(l);
                          }
                        }}
                        onFocus={(el) => el.select()}
                      />
                      <RangePair
                        title="빼기 결과값 범위"
                        left={answerSubMin}
                        right={answerSubMax}
                        disabledLeft={isAdd}
                        disabledRight={isAdd}
                        leftTitleClassName={isAdd ? "text-gray-400" : ""}
                        rightTitleClassName={isAdd ? "text-gray-500" : ""}
                        onLeftChange={setAnswerSubMin}
                        onRightChange={setAnswerSubMax}
                        onValidate={(l, r) => {
                          if (r > 0 && r < l) {
                            showToast("빼기 결과값 최대가 최소보다 작을 수 없습니다");
                            setAnswerSubMax(l);
                          }
                        }}
                        onFocus={(el) => el.select()}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                    <p className="text-xs text-slate-500 font-bold mb-2">곱하기/나누기 결과값 범위</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <RangePair
                        title="곱하기 결과값 범위"
                        left={type === "mul" ? answerMulMin : answerDivMin}
                        right={type === "mul" ? answerMulMax : answerDivMax}
                        disabledLeft={isDiv}
                        disabledRight={isDiv}
                        leftTitleClassName={isDiv ? "text-gray-400" : ""}
                        rightTitleClassName={isDiv ? "text-gray-500" : ""}
                        onLeftChange={(v) => {
                          if (type === "mul") setAnswerMulMin(v);
                          else if (type === "div") setAnswerDivMin(v);
                        }}
                        onRightChange={(v) => {
                          if (type === "mul") setAnswerMulMax(v);
                          else if (type === "div") setAnswerDivMax(v);
                        }}
                        onValidate={(l, r) => {
                          if (r > 0 && r < l) {
                            showToast(type === "mul" ? "곱하기 결과값 최대가 최소보다 작을 수 없습니다" : "나누기 결과값 최대가 최소보다 작을 수 없습니다");
                            if (type === "div") setAnswerDivMax(l);
                            else setAnswerMulMax(l);
                          }
                        }}
                        onFocus={(el) => el.select()}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mb-5">* 더하기/빼기/혼합 또는 곱하기/나누기 혼합에서 결과값 범위를 지원합니다.</p>
            )}
          </>
        ) : (
          <div className="space-y-5 mb-5">
            <label className="block text-sm font-bold mb-2">두 자리 수 범위</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                <p className="block text-xs text-slate-500 font-bold mb-2">첫째 수 범위</p>
                <div className="flex gap-2 items-center">
                  <NumberInput
                    value={screenshotFirstMin}
                    onChange={setScreenshotFirstMin}
                    onBlur={() => normalizeRangeOnBlur("s1")}
                    onFocus={(e) => e.select()}
                  />
                  <span className="font-bold text-gray-400">~</span>
                  <NumberInput
                    value={screenshotFirstMax}
                    onChange={setScreenshotFirstMax}
                    onBlur={() => normalizeRangeOnBlur("s1")}
                    onFocus={(e) => e.select()}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                <p className="block text-xs text-slate-500 font-bold mb-2">둘째 수 범위</p>
                <div className="flex gap-2 items-center">
                  <NumberInput
                    value={screenshotSecondMin}
                    onChange={setScreenshotSecondMin}
                    onBlur={() => normalizeRangeOnBlur("s2")}
                    onFocus={(e) => e.select()}
                  />
                  <span className="font-bold text-gray-400">~</span>
                  <NumberInput
                    value={screenshotSecondMax}
                    onChange={setScreenshotSecondMax}
                    onBlur={() => normalizeRangeOnBlur("s2")}
                    onFocus={(e) => e.select()}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-xs text-slate-500 font-bold mb-2">샘플 미리보기</p>
              <div className="space-y-3 text-sm">
                <p className="text-gray-500">예시 (고급 사칙연산 워크시트)</p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-base">
                  <p className="text-[13px] leading-8 whitespace-nowrap">
                    <span className="font-bold">{screenshotFirstMin} + {screenshotSecondMin}</span>
                    <span className="text-gray-500"> = </span>
                    <span className="font-medium">{screenshotSampleLeftRoundedA}</span>
                    <span> + </span>
                    <span className="inline-block rounded-full bg-[#ededed] px-2">[ ]</span>
                    <span> + </span>
                    <span className="inline-block rounded-full bg-[#ededed] px-2">{screenshotSecondMin}</span>
                  </p>
                  <p className="text-[13px] leading-8 text-slate-500 whitespace-nowrap">
                    <span className="font-bold">{screenshotFirstMin} + {screenshotSecondMin}</span>
                    <span> = </span>
                    <span className="font-medium">{screenshotFirstMin}</span>
                    <span> + </span>
                    <span className="inline-block rounded-full bg-[#ededed] px-2">{screenshotSampleRightRoundedB} - [ ]</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <label className="block font-bold text-sm mb-2">기본 설정</label>
        <div className={`rounded-xl border border-slate-200/80 bg-white p-3 ${mode === "standard" ? "mb-5" : "mb-5"}`}>
          <div className={`grid ${mode === "standard" ? "grid-cols-1 sm:grid-cols-3 gap-3" : "grid-cols-2 gap-3"}`}>
            {mode === "standard" ? (
              <>
                <div>
                  <p className="block text-xs text-slate-500 font-bold mb-2">레이아웃</p>
                  <Dropdown
                    value={layout === "a" ? 1 : 2}
                    options={[
                      { value: 1, label: "3열" },
                      { value: 2, label: "2열" },
                    ]}
                    onChange={(v) => setLayout(v === 1 ? "a" : "b")}
                  />
                </div>
                <div>
                  <p className="block text-xs text-slate-500 font-bold mb-2">문제수</p>
                  <Dropdown
                    value={count}
                    options={countOptions.map((n) => ({ value: n, label: `${n}문제` }))}
                    onChange={(v) => {
                      setCount(v);
                      setStandardCount(v);
                    }}
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
              </>
            ) : (
              <>
                <div>
                  <p className="block text-xs text-slate-500 font-bold mb-2">문제수</p>
                  <div className="h-11 rounded-lg border-2 border-slate-200 bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center">
                    5문제 고정
                  </div>
                </div>
                <div>
                  <p className="block text-xs text-slate-500 font-bold mb-2">장수</p>
                  <Dropdown
                    value={sheets}
                    options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}장` }))}
                    onChange={setSheets}
                  />
                </div>
              </>
            )}
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
