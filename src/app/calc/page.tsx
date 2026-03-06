"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dropdown from "@/components/Dropdown";
import NavBack from "@/components/NavBack";
import Toast from "@/components/ui/Toast";
import RangeNumericInput from "@/components/ui/RangeNumericInput";
import { trackEvent, GA_EVENTS } from "@/lib/ga";
import { encodeCalcParams } from "@/lib/math-generator";

type CalcType = "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div";

function RangePair({
  idPrefix,
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
}: {
  idPrefix: string;
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
}) {
  return (
    <div>
      <RangeNumericInput
        idPrefix={idPrefix}
        label={title}
        minValue={left}
        maxValue={right}
        onMinChange={onLeftChange}
        onMaxChange={onRightChange}
        onMinBlur={() => onValidate(left, right, "min")}
        onMaxBlur={() => onValidate(left, right, "max")}
        onFocusSelect
        disabledMin={disabledLeft}
        disabledMax={disabledRight}
        labelClassName={`font-bold text-sm mb-2 ${leftTitleClassName ?? ""} ${rightTitleClassName ?? ""}`}
      />
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
  const quickRangeError =
    rangeMin <= 0 || rangeMax <= 0 || opMin <= 0 || opMax <= 0 || rangeMin > rangeMax || opMin > opMax
      ? "수 범위와 둘째 수 범위를 확인해 주세요"
      : "";
  const isMixedAddSub = type === "add_sub";
  const isMixedMulDiv = type === "mul_div";
  const isAdd = type === "add";
  const isSub = type === "sub";
  const isMul = type === "mul";
  const isDiv = type === "div";

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

  const teacherPresets = [
    {
      label: "엄마 추천: 한자리 기본",
      desc: "첫째/둘째 수를 한 자릿수로, 결과도 작게",
      data: { rangeMin: 1, rangeMax: 10, opMin: 1, opMax: 9, answerMin: 1, answerMax: 18, count: 12, sheets: 1 },
    },
    {
      label: "학교 숙제(소량)",
      desc: "반복연습용, 혼합형에도 적합",
      data: { rangeMin: 10, rangeMax: 30, opMin: 1, opMax: 12, answerMin: 1, answerMax: 50, count: 24, sheets: 1 },
    },
    {
      label: "반 친구 활동(중간)",
      desc: "복습용으로 여러 장 인쇄",
      data: { rangeMin: 1, rangeMax: 20, opMin: 2, opMax: 15, answerMin: 1, answerMax: 99, count: 36, sheets: 2 },
    },
    {
      label: "심화: 곱/나눗셈 집중",
      desc: "곱/나눗셈 학습단계",
      data: { rangeMin: 10, rangeMax: 80, opMin: 1, opMax: 12, answerMin: 1, answerMax: 200, count: 24, sheets: 1 },
    },
  ] as const;

  function applyPreset(preset: (typeof teacherPresets)[number]["data"]) {
    setRangeMin(preset.rangeMin);
    setRangeMax(preset.rangeMax);
    setOpMin(preset.opMin);
    setOpMax(preset.opMax);
    setCount(preset.count);
    setSheets(preset.sheets);
    setAnswerMin(preset.answerMin);
    setAnswerMax(preset.answerMax);
    setAnswerAddMin(preset.answerMin);
    setAnswerAddMax(preset.answerMax);
    setAnswerSubMin(preset.answerMin);
    setAnswerSubMax(preset.answerMax);
    setAnswerMulMin(preset.answerMin);
    setAnswerMulMax(preset.answerMax);
    setAnswerDivMin(preset.answerMin);
    setAnswerDivMax(preset.answerMax);
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

    const encodedParams = encodeCalcParams({
      type,
      count,
      sheets,
      rangeMin,
      rangeMax,
      opMin,
      opMax,
      answerMin: isAdd
        ? answerAddMin
        : isSub
          ? answerSubMin
          : isMul
            ? answerMulMin
            : isDiv
              ? answerDivMin
              : isArithmeticResultRange
                ? answerMin
                : undefined,
      answerMax: isAdd
        ? answerAddMax
        : isSub
          ? answerSubMax
          : isMul
            ? answerMulMax
            : isDiv
              ? answerDivMax
              : isArithmeticResultRange
                ? answerMax
                : undefined,
      answerAddMin: isMixedAddSub ? answerAddMin : undefined,
      answerAddMax: isMixedAddSub ? answerAddMax : undefined,
      answerSubMin: isMixedAddSub ? answerSubMin : undefined,
      answerSubMax: isMixedAddSub ? answerSubMax : undefined,
      answerMulMin: isMixedMulDiv ? answerMulMin : undefined,
      answerMulMax: isMixedMulDiv ? answerMulMax : undefined,
      answerDivMin: isMixedMulDiv ? answerDivMin : undefined,
      answerDivMax: isMixedMulDiv ? answerDivMax : undefined,
      layout,
    });

    trackEvent(GA_EVENTS.GENERATE, { page: 'calc', type, count, sheets, range_min: rangeMin, range_max: rangeMax, layout });
    router.push(`/calc/preview?${encodedParams}`);
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100/70 px-4 pb-8">
      <Toast message={toast} />
      <NavBack href="/" label="메인으로" gaEvent={GA_EVENTS.NAV_HOME} gaFrom="calc" />
      <div className="max-w-[860px] mx-auto mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Mathlab • Calculator</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">일반 연산</h1>
        <p className="mt-2 text-sm text-slate-600">교재처럼 숫자범위를 잡고, 수업/숙제에 맞는 문제수를 바로 생성하세요.</p>
      </div>

      <section className="max-w-[860px] mx-auto mb-6 bg-white/95 rounded-[22px] border border-slate-200 p-5">
        <p className="text-xs font-bold text-slate-500">변경됨: 일반 연산 실험 모드</p>
        <h2 className="mt-2 text-lg font-black text-slate-900">간편 모드</h2>
        <p className="mt-1 text-sm text-slate-600">기본값만 먼저 맞춰 빠르게 생성하고, 필요하면 수동 설정으로 이동하세요.</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {teacherPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.data)}
              className="text-left rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 hover:border-slate-900 transition-all"
            >
              <p className="text-sm font-bold text-slate-900">{preset.label}</p>
              <p className="text-xs text-slate-500 mt-1">{preset.desc}</p>
            </button>
          ))}
        </div>
        {quickRangeError ? (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2">{quickRangeError}</p>
        ) : null}
        <div className="mt-3">
          <a href="#calc-manual-mode" className="inline-flex text-sm font-bold text-slate-700 underline">현재의 수동 설정으로 이동</a>
        </div>
      </section>

      <section id="calc-manual-mode" className="max-w-[860px] mx-auto bg-white/95 rounded-[28px] border border-slate-200 shadow-[0_20px_54px_rgba(15,23,42,0.08)] p-6 md:p-8">
        <div className="mb-5">
          <label className="block font-bold text-sm mb-2">연산 유형</label>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs text-slate-500 font-bold mb-2">더하기/빼기</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {([["add", "+더하기"], ["sub", "−빼기"], ["add_sub", "혼합"]] as [CalcType, string][]).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={type === k}
                  onClick={() => setType(k)}
                  className={`w-full text-center py-2.5 px-2 border-2 rounded-2xl font-bold text-sm cursor-pointer transition-all ${
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
                  aria-pressed={type === k}
                  onClick={() => setType(k)}
                  className={`w-full text-center py-2.5 px-2 border-2 rounded-2xl font-bold text-sm cursor-pointer transition-all ${
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <RangeNumericInput
              idPrefix="calc-range"
              label="첫째 수 범위"
              minValue={rangeMin}
              maxValue={rangeMax}
              onMinChange={setRangeMin}
              onMaxChange={setRangeMax}
              onMinBlur={() => normalizeRangeOnBlur("range")}
              onMaxBlur={() => normalizeRangeOnBlur("range")}
              onFocusSelect
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <RangeNumericInput
              idPrefix="calc-op"
              label="둘째 수 범위"
              minValue={opMin}
              maxValue={opMax}
              onMinChange={setOpMin}
              onMaxChange={setOpMax}
              onMinBlur={() => normalizeRangeOnBlur("op")}
              onMaxBlur={() => normalizeRangeOnBlur("op")}
              onFocusSelect
            />
          </div>
        </div>

        {isArithmeticResultRange ? (
          <div className="mb-5 transition-opacity opacity-100 space-y-4">
            {isMixedAddSub ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs text-slate-500 font-bold mb-2">더하기/빼기 결과값 범위</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <RangePair
                    idPrefix="calc-answer-add-mix"
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
                  />
                  <RangePair
                    idPrefix="calc-answer-sub-mix"
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
                  />
                </div>
              </div>
            ) : isMixedMulDiv ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs text-slate-500 font-bold mb-2">곱하기/나누기 결과값 범위</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <RangePair
                    idPrefix="calc-answer-mul-mix"
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
                  />
                  <RangePair
                    idPrefix="calc-answer-div-mix"
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
                  />
                </div>
              </div>
            ) : type === "add" || type === "sub" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs text-slate-500 font-bold mb-2">더하기/빼기 결과값 범위</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <RangePair
                    idPrefix="calc-answer-add-single"
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
                  />
                  <RangePair
                    idPrefix="calc-answer-sub-single"
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
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs text-slate-500 font-bold mb-2">곱하기/나누기 결과값 범위</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <RangePair
                    idPrefix="calc-answer-mul-single"
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
                  />
                  <RangePair
                    idPrefix="calc-answer-div-single"
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
              <label htmlFor="calc-layout" className="block text-xs text-slate-500 font-bold mb-2">레이아웃</label>
              <Dropdown
                id="calc-layout"
                value={layout === "a" ? 1 : 2}
                options={[
                  { value: 1, label: "3열" },
                  { value: 2, label: "2열" },
                ]}
                onChange={(v) => setLayout(v === 1 ? "a" : "b")}
              />
            </div>
            <div>
              <label htmlFor="calc-count" className="block text-xs text-slate-500 font-bold mb-2">문제수</label>
              <Dropdown
                id="calc-count"
                value={count}
                options={countOptions.map((n) => ({ value: n, label: `${n}문제` }))}
                onChange={setCount}
              />
            </div>
            <div>
              <label htmlFor="calc-sheets" className="block text-xs text-slate-500 font-bold mb-2">장수</label>
              <Dropdown
                id="calc-sheets"
                value={sheets}
                options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}장` }))}
                onChange={setSheets}
              />
            </div>
          </div>
        </div>

        <div className="mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
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
          type="button"
          onClick={generate}
          className="w-full py-3.8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white font-black text-base cursor-pointer transition-all duration-200 mt-2"
        >
          문제 생성
        </button>
      </section>
    </div>
  );
}
