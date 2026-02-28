"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dropdown from "@/components/Dropdown";
import NavBack from "@/components/NavBack";
import { trackEvent, GA_EVENTS } from "@/lib/ga";

type CalcType = "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div";

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
      onFocus={(e) => onFocus?.(e.target)}
      disabled={disabled}
      className={
        className ??
        "w-full flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
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

export default function CalcPage() {
  const router = useRouter();
  const [type, setType] = useState<CalcType>("add");
  const [count, setCount] = useState(24);
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

  const [layout, setLayout] = useState<"a" | "b">("a");
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

  const countOptions = [12, 18, 24, 36];
  const isArithmeticResultRange =
    type === "add" || type === "sub" || type === "add_sub" || type === "mul" || type === "div" || type === "mul_div";
  const isMixedAddSub = type === "add_sub";
  const isMixedMulDiv = type === "mul_div";
  const isAdd = type === "add";
  const isSub = type === "sub";
  const isMul = type === "mul";
  const isDiv = type === "div";

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

  function normalizeRangeOnBlur(minName: "range" | "op") {
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
    }
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

    if (isMixedAddSub) {
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
    } else if (isMul) {
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
    } else if (isArithmeticResultRange && (answerMin <= 0 || answerMax <= 0)) {
      showToast("결과값 범위를 입력해주세요");
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

    trackEvent(GA_EVENTS.GENERATE, { page: 'calc', type, count, sheets, range_min: rangeMin, range_max: rangeMax, layout });
    router.push(`/calc/preview?${params.toString()}`);
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-100/80 via-white to-slate-50 px-4 pb-8">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in">
          {toast}
        </div>
      )}
      <NavBack href="/" label="메인으로" gaEvent={GA_EVENTS.NAV_HOME} gaFrom="calc" />
      <h1 className="text-3xl font-black text-slate-900 text-center mb-6 tracking-tight">일반 연산</h1>

      <div className="max-w-[680px] mx-auto bg-white/90 backdrop-blur border border-slate-200/90 rounded-[28px] shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6 md:p-7">
        <div className="mb-5">
          <label className="block font-bold text-sm mb-2">연산 유형</label>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3">
            <p className="text-xs text-slate-500 font-bold mb-2">더하기/빼기</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {([["add", "+더하기"], ["sub", "−빼기"], ["add_sub", "혼합"]] as [CalcType, string][]).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
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
              {([["mul", "×곱하기"], ["div", "÷나누기"], ["mul_div", "혼합"]] as [CalcType, string][]).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
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


        <label className="block text-sm font-bold mb-2">수 범위</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl border border-slate-200/80 bg-white p-3">
            <p className="block text-xs text-slate-500 font-bold mb-2">첫째 수 범위</p>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                inputMode="numeric"
                value={rangeMin}
                onChange={(e) => {
                  setRangeMin(parseNumericInput(e.target.value));
                }}
                onBlur={() => normalizeRangeOnBlur("range")}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
              <span className="font-bold text-gray-400">~</span>
              <input
                type="text"
                inputMode="numeric"
                value={rangeMax}
                onChange={(e) => {
                  setRangeMax(parseNumericInput(e.target.value));
                }}
                onBlur={() => normalizeRangeOnBlur("range")}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3">
            <p className="block text-xs text-slate-500 font-bold mb-2">둘째 수 범위</p>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                inputMode="numeric"
                value={opMin}
                onChange={(e) => setOpMin(parseNumericInput(e.target.value))}
                onBlur={() => normalizeRangeOnBlur("op")}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
              <span className="font-bold text-gray-400">~</span>
              <input
                type="text"
                inputMode="numeric"
                value={opMax}
                onChange={(e) => setOpMax(parseNumericInput(e.target.value))}
                onBlur={() => normalizeRangeOnBlur("op")}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 p-2.5 border-2 border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:border-slate-400 bg-white"
              />
            </div>
          </div>
        </div>

        {isArithmeticResultRange ? (
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
            ) : type === "add" || type === "sub" ? (
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
                  <RangePair
                    title="나누기 결과값 범위"
                    left={type === "mul" ? answerDivMin : answerDivMin}
                    right={type === "mul" ? answerDivMax : answerDivMax}
                    disabledLeft={isMul}
                    disabledRight={isMul}
                    leftTitleClassName={isMul ? "text-gray-400" : ""}
                    rightTitleClassName={isMul ? "text-gray-500" : ""}
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
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 mb-5">* 더하기/빼기/혼합 또는 곱하기/나누기 혼합에서 결과값 범위를 지원합니다.</p>
        )}

        <label className="block font-bold text-sm mb-2">기본 설정</label>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

        <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
          <p className="text-xs text-slate-500 mb-3 font-medium">미리보기</p>
          <div className="flex gap-8 text-lg font-semibold" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
            {[0, 1, 2].map((i) => {
              const a = i === 0 ? rangeMin : i === 1 ? Math.round((rangeMin + rangeMax) / 2) : rangeMax;
              const b = i === 0 ? opMin : i === 1 ? Math.round((opMin + opMax) / 2) : opMax;
              const signs = { add: "+", sub: "−", add_sub: i === 0 ? "+" : "−", mul: "×", div: "÷", mul_div: i === 0 ? "×" : "÷" } as const;
              return (
                <div key={i} className="flex items-center gap-1">
                  <span className="shrink-0 mr-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">{i + 1}</span>
                  <span>
                    {a} {signs[type]} {b} =
                  </span>
                </div>
              );
            })}
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
