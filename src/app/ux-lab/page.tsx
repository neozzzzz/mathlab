"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Target } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import { GA_EVENTS } from "@/lib/ga";

type CalcType = "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div";

const PRESETS = [
  { label: "빠른 시작 A", desc: "한자리 연산 기본", payload: { type: "add" as const, rangeMin: 1, rangeMax: 10, opMin: 1, opMax: 9, count: 12, sheets: 1 } },
  { label: "반 반복", desc: "반 수업용 양식", payload: { type: "add_sub" as const, rangeMin: 1, rangeMax: 20, opMin: 1, opMax: 12, count: 18, sheets: 1 } },
  { label: "집중형", desc: "문항 수 확대", payload: { type: "mul_div" as const, rangeMin: 2, rangeMax: 20, opMin: 2, opMax: 12, count: 24, sheets: 2 } },
];

function fieldError(rangeMin: number, rangeMax: number) {
  if (Number.isNaN(rangeMin) || Number.isNaN(rangeMax)) return "숫자 범위를 입력해 주세요";
  if (rangeMin <= 0 || rangeMax <= 0) return "범위는 1 이상이어야 합니다";
  if (rangeMin > rangeMax) return "앞 숫자가 뒤 숫자보다 작아야 합니다";
  if (rangeMax - rangeMin > 500) return "범위를 너무 넓게 잡으면 생성이 느려질 수 있어요";
  return "";
}

export default function UxLabPage() {
  const [type, setType] = useState<CalcType>("add");
  const [count, setCount] = useState(24);
  const [sheets, setSheets] = useState(1);
  const [rangeMin, setRangeMin] = useState(11);
  const [rangeMax, setRangeMax] = useState(18);
  const [opMin, setOpMin] = useState(2);
  const [opMax, setOpMax] = useState(9);
  const [advanced, setAdvanced] = useState(false);

  const typeLabel: Record<CalcType, string> = {
    add: "더하기",
    sub: "빼기",
    add_sub: "더하기+빼기",
    mul: "곱하기",
    div: "나누기",
    mul_div: "곱하기+나누기",
  };

  const firstRangeError = useMemo(() => fieldError(rangeMin, rangeMax), [rangeMin, rangeMax]);
  const secondRangeError = useMemo(() => fieldError(opMin, opMax), [opMin, opMax]);

  const ready = !firstRangeError && !secondRangeError && count > 0 && sheets > 0;

  return (
    <div className="min-h-screen bg-slate-100/70 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
          <p className="text-xs tracking-[0.24em] text-slate-500 font-bold">UX TEMP LAB</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-slate-900">일반 연산 임시 실험 화면</h1>
          <p className="mt-2 text-sm text-slate-600">
            상세 화면 UX 개선안(임시). 기본 흐름은 유지하고, 설정 밀도를 줄여 <strong>처음 진입자 이탈</strong>을 줄이는 실험 화면입니다.
          </p>
          <div className="mt-4">
            <TrackedLink
              href="/"
              gaEvent={GA_EVENTS.SELECT_MENU}
              gaParams={{ menu: "ux_lab_back" }}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"
            >
              메인으로
            </TrackedLink>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="font-black text-slate-900">1. 빠른 시작</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setType(preset.payload.type);
                  setRangeMin(preset.payload.rangeMin);
                  setRangeMax(preset.payload.rangeMax);
                  setOpMin(preset.payload.opMin);
                  setOpMax(preset.payload.opMax);
                  setCount(preset.payload.count);
                  setSheets(preset.payload.sheets);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 text-left px-3 py-3 hover:border-slate-900 transition-all"
              >
                <p className="text-sm font-bold text-slate-900">{preset.label}</p>
                <p className="text-xs text-slate-500 mt-1">{preset.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-slate-900">2. 설정</h2>
            <button
              type="button"
              onClick={() => setAdvanced((v) => !v)}
              className="inline-flex items-center text-sm gap-1 px-3 py-1.5 rounded-full border border-slate-300"
            >
              고급 설정 {advanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="font-bold text-slate-700">연산 유형</span>
              <div className="mt-2">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CalcType)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  {(Object.keys(typeLabel) as CalcType[]).map((k) => (
                    <option key={k} value={k}>
                      {typeLabel[k]}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="text-sm">
              <span className="font-bold text-slate-700">문항 수</span>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full mt-2 rounded-xl border border-slate-300 px-3 py-2"
              >
                {[12, 18, 24, 36].map((v) => (
                  <option key={v} value={v}>{v}문제</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="font-bold text-slate-700">첫째 수</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  value={rangeMin}
                  onChange={(e) => setRangeMin(Number(e.target.value.replace(/[^0-9]/g, "")))}
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="최소"
                />
                <input
                  value={rangeMax}
                  onChange={(e) => setRangeMax(Number(e.target.value.replace(/[^0-9]/g, "")))}
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="최대"
                />
              </div>
            </label>

            <label className="text-sm">
              <span className="font-bold text-slate-700">둘째 수</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  value={opMin}
                  onChange={(e) => setOpMin(Number(e.target.value.replace(/[^0-9]/g, "")))}
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="최소"
                />
                <input
                  value={opMax}
                  onChange={(e) => setOpMax(Number(e.target.value.replace(/[^0-9]/g, "")))}
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="최대"
                />
              </div>
            </label>
          </div>

          {firstRangeError || secondRangeError ? (
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm px-3 py-2">
              {firstRangeError || secondRangeError}
            </div>
          ) : null}

          {advanced ? (
            <div className="mt-4 border border-slate-200 rounded-xl p-3 text-sm text-slate-600">
              <p className="font-bold text-slate-900 mb-1">고급 설정(실험)</p>
              <p>장수·정렬/레이아웃·결과값 범위 제약은 추후 추가 실험에서 순차 반영할 예정입니다.</p>
            </div>
          ) : null}

          <div className="mt-4 border border-slate-200 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-500" />
              현재 설정 요약: {typeLabel[type]} / {count}문제 / {sheets}장
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row gap-3">
          <TrackedLink
            href="/calc"
            gaEvent={GA_EVENTS.SELECT_MENU}
            gaParams={{ menu: "ux_lab_to_calc" }}
            className={`inline-flex items-center justify-center rounded-xl py-3 px-4 font-bold text-white ${ready ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-400 cursor-not-allowed"}`}
          >
            문제지 만들기 (임시)
          </TrackedLink>
          <Link
            href="/demo-gradients"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 py-3 px-4 font-bold text-slate-700 hover:border-slate-500"
          >
            실험 텍스트 비교로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
