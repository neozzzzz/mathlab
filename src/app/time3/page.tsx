"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import Dropdown from "@/components/Dropdown";
import { encodeTime3Params, time3PagesPerSet, TIME3_SET_OPTIONS, TIME3_SET_ORDER } from "@/lib/math-generator";
import { trackEvent, GA_EVENTS } from "@/lib/ga";

// 한 세트에 들어가는 유형(쉬운 것부터). 문항 수는 TIME3_SET_ORDER 와 같다.
const SET_GROUPS: { title: string; items: string }[] = [
  { title: "시각 읽기", items: "바늘 설명 보고 시각 구하기 · 작은 눈금 덜 간 곳" },
  { title: "시각 비교", items: "몇 시 몇 분 전 · 디지털 시계 · 먼저·나중에 한 일" },
  { title: "거울에 비친 시계", items: "시각 읽기 · 몇 분 전 · 바르게 말한 어린이" },
  { title: "시간과 분", items: "같은 것끼리 잇기 · 틀린 것 찾기 · ㉠과 ㉡의 합 · 더 오래 한 어린이" },
  { title: "걸린 시간", items: "시계 두 개 보고 구하기 · 몇 분 더 · 같은 활동끼리 잇기" },
  { title: "끝난 시각", items: "시곗바늘 그려 넣기" },
  { title: "서술형", items: "가장 먼저 온 어린이 풀이 쓰기" },
];

const PAGES_PER_SET = time3PagesPerSet();
const PROBLEMS_PER_SET = TIME3_SET_ORDER.length;

export default function Time3Page() {
  const router = useRouter();
  const [sets, setSets] = useState(1);

  function generate() {
    const query = encodeTime3Params({ sets });
    trackEvent(GA_EVENTS.GENERATE, { page: "time3", sets });
    router.push(`/time3/preview?${query}`);
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100/80 px-4 py-8">
      <div className="max-w-[600px] mx-auto mb-4">
        <Link
          href="/"
          onClick={() => trackEvent(GA_EVENTS.NAV_HOME, { from: "time3" })}
          className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold"
        >
          <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
          <span className="ml-1 transition-all duration-150 group-hover:font-bold">메인으로</span>
        </Link>
      </div>

      <h1 className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tight">시간 3</h1>
      <p className="text-center text-sm text-slate-500 mb-6">시각과 시간 유형 익히기 · 세트 인쇄 설정</p>

      <div className="max-w-[600px] mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)] p-6 md:p-7 space-y-5">
        <div>
          <p className="block text-sm font-bold mb-2">한 세트 구성 · {PROBLEMS_PER_SET}문제</p>
          <ol className="rounded-xl border border-slate-200/80 divide-y divide-slate-100 text-sm">
            {SET_GROUPS.map((group, i) => (
              <li key={group.title} className="flex gap-3 px-3 py-2">
                <span className="w-5 shrink-0 text-slate-400 font-bold">{i + 1}</span>
                <span className="w-28 shrink-0 font-bold text-slate-800">{group.title}</span>
                <span className="text-slate-500">{group.items}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-slate-500">쉬운 유형부터 차례로 나옵니다. 세트마다 숫자와 이름이 바뀝니다.</p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">세트 수</label>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 grid grid-cols-2 gap-3 items-center">
            <Dropdown
              value={sets}
              options={TIME3_SET_OPTIONS.map((n) => ({ value: n, label: `${n}세트 · ${n * PAGES_PER_SET}장` }))}
              onChange={setSets}
            />
            <p className="text-sm text-slate-600">
              1세트 = {PAGES_PER_SET}장
              <br />
              <span className="font-bold text-slate-900">
                총 {sets * PAGES_PER_SET}장 · {sets * PROBLEMS_PER_SET}문제
              </span>
            </p>
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
