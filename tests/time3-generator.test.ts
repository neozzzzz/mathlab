import test from "node:test";
import assert from "node:assert/strict";
import {
  encodeTime3Params,
  parseTime3Params,
  generateTime3Set,
  generateTime3AllSets,
  layoutTime3Set,
  time3ColumnHeight,
  time3PagesPerSet,
  formatClockKorean,
  TIME3_SET_ORDER,
  type Time3Problem,
} from "../src/lib/math-generator.ts";

const SEEDS = Array.from({ length: 40 }, (_, i) => `s=1&seed=${i}`);
const allProblems = (): Time3Problem[] => SEEDS.flatMap((q) => [0, 1, 2].flatMap((i) => generateTime3Set(q, i)));
const byKind = <K extends Time3Problem["kind"]>(kind: K) =>
  allProblems().filter((p): p is Extract<Time3Problem, { kind: K }> => p.kind === kind);

/** 거울에 비친 시계를 그대로 읽은 시각(12시간제 분) */
const mirrorOf = (m: number) => (720 - (m % 720)) % 720;

test("time3: 한 세트는 스크린샷 22문항 형식을 쉬운 유형부터 차례로 낸다", () => {
  assert.equal(TIME3_SET_ORDER.length, 22);
  const kinds = new Set(TIME3_SET_ORDER);
  for (const kind of [
    "describe", "describe_before", "describe_talk", "compare_two", "compare_clock_digital", "order_three",
    "latest_clock", "mirror_read", "mirror_before", "mirror_who", "match_convert", "find_wrong", "sum_blanks",
    "compare_duration", "clock_elapsed", "until_clock", "remaining", "match_elapsed", "draw_end",
    "draw_end_repeat", "essay_arrival",
  ]) {
    assert.ok(kinds.has(kind as Time3Problem["kind"]), kind);
  }
  // 시각 읽기로 시작해 서술형으로 끝난다.
  assert.equal(TIME3_SET_ORDER[0], "describe");
  assert.equal(TIME3_SET_ORDER.at(-1), "essay_arrival");
  assert.deepEqual(generateTime3Set("s=1", 0).map((p) => p.kind), [...TIME3_SET_ORDER]);
});

test("time3: 세트 단위 인쇄 — 세트 수만큼 장수와 문제 수가 늘어난다", () => {
  const pages = time3PagesPerSet();
  assert.equal(pages, 3, `pages=${pages}`);
  const layout = layoutTime3Set();
  assert.equal(layout.length, pages);
  // 모든 문항이 한 번씩, 순서대로 들어간다.
  assert.deepEqual(layout.flat(2), TIME3_SET_ORDER.map((_, i) => i));
  for (const page of layout) assert.equal(page.length, 2);

  const one = generateTime3AllSets({ sets: 1 }, encodeTime3Params({ sets: 1 }));
  const two = generateTime3AllSets({ sets: 2 }, encodeTime3Params({ sets: 2 }));
  assert.equal(one.length, 1);
  assert.equal(two.length, 2);
  assert.equal(two.flat().length, 2 * one.flat().length);
  assert.notDeepEqual(two[0], two[1]);
});

test("time3: 한 장 안에서 왼쪽·오른쪽 열 높이를 고르게 나눈다", () => {
  for (const [left, right] of layoutTime3Set()) {
    const items = [...left, ...right];
    const best = Math.min(
      ...items.map((_, k) => Math.max(time3ColumnHeight(items.slice(0, k)), time3ColumnHeight(items.slice(k)))),
      time3ColumnHeight(items),
    );
    assert.equal(Math.max(time3ColumnHeight(left), time3ColumnHeight(right)), best, JSON.stringify([left, right]));
  }
});

test("time3: 주소 인코딩·파싱", () => {
  assert.deepEqual(parseTime3Params(encodeTime3Params({ sets: 3 })), { sets: 3 });
  assert.equal(parseTime3Params("sets=0"), null);
  assert.equal(parseTime3Params("sets=6"), null);
  assert.equal(parseTime3Params("x=1"), null);
});

test("time3: 같은 주소는 같은 문제", () => {
  assert.deepEqual(generateTime3Set("sets=2", 1), generateTime3Set("sets=2", 1));
});

test("time3: 설명하는 시각 — 바늘 설명과 정답이 맞다", () => {
  for (const p of byKind("describe")) {
    assert.equal(p.answer, p.hour * 60 + p.mark * 5);
    assert.ok(p.mark >= 1 && p.mark <= 11);
  }
  for (const p of byKind("describe_before")) {
    assert.equal(p.answer, p.hour * 60 + p.mark * 5 - p.less);
    assert.ok(p.less >= 1 && p.less <= 4 && p.answer % 60 !== 0);
    assert.match(p.text, new RegExp(`${p.mark}에서 작은 눈금 ${p.less}칸 덜 간 곳`));
  }
  for (const p of byKind("describe_talk")) {
    assert.equal(p.answer, p.hour * 60 + 60 - p.less);
    assert.match(p.lines[1], /12에서 작은 눈금 \d칸 덜 간 곳/);
  }
});

test("time3: 시각 비교 — 고른 어린이가 맞다", () => {
  for (const p of byKind("compare_two")) {
    const [a, b] = p.times;
    assert.notEqual(a, b);
    const later = a > b ? 0 : 1;
    assert.equal(p.answer, p.names[p.ask === "later" ? later : 1 - later]);
    assert.match(p.labels[0], /분 전$/);
  }
  for (const p of byKind("compare_clock_digital")) {
    assert.notEqual(p.times[0], p.times[1]);
    const earlier = p.times[0] < p.times[1] ? 0 : 1;
    assert.equal(p.answer, p.names[earlier]);
  }
  for (const p of byKind("order_three")) {
    assert.equal(formatClockKorean(p.beforeAnswer), formatClockKorean(p.times[p.beforeIndex]));
    const sorted = [...p.names].sort((x, y) => p.times[p.names.indexOf(x)] - p.times[p.names.indexOf(y)]);
    assert.deepEqual(p.answer, sorted);
    assert.equal(new Set(p.times).size, 3);
  }
  for (const p of byKind("latest_clock")) {
    assert.equal(new Set(p.times).size, 3);
    const pick = p.ask === "latest" ? Math.max(...p.times) : Math.min(...p.times);
    assert.equal(p.answer, p.activities[p.times.indexOf(pick)]);
  }
});

test("time3: 거울 시계 — 정답과 잘못 읽은 시각이 다르다", () => {
  for (const p of byKind("mirror_read")) {
    assert.notEqual(mirrorOf(p.time), p.time % 720);
    assert.equal(p.answer, p.time);
  }
  for (const p of byKind("mirror_before")) {
    assert.ok(p.time % 60 >= 40);
    assert.equal(p.answerHour * 60 - p.answerBefore, p.time);
  }
  for (const p of byKind("mirror_who")) {
    const correct = p.statements.find((s) => s.name === p.answer)!;
    const wrong = p.statements.find((s) => s.name !== p.answer)!;
    assert.equal(correct.time % 720, p.time % 720);
    assert.equal(wrong.time % 720, mirrorOf(p.time));
  }
});

test("time3: 시간과 분 — 잇기·틀린 것·합·비교", () => {
  for (const p of byKind("match_convert")) {
    assert.equal(p.left.length, 3);
    assert.deepEqual([...p.right].sort(), [...p.left].sort());
    assert.ok(p.left.every((m) => m > 60 && m % 60 !== 0));
  }
  for (const p of byKind("find_wrong")) {
    assert.equal(p.items.filter((it) => !it.correct).length, 1);
    assert.equal(p.answer, ["㉠", "㉡", "㉢"][p.items.findIndex((it) => !it.correct)]);
  }
  for (const p of byKind("sum_blanks")) {
    assert.equal(p.answer, (p.minutesA % 60) + (p.hoursB * 60 + p.minutesB));
  }
  for (const p of byKind("compare_duration")) {
    assert.notEqual(p.durations[0], p.durations[1]);
    assert.equal(p.answer, p.names[p.durations[0] > p.durations[1] ? 0 : 1]);
  }
  for (const p of byKind("essay_arrival")) {
    assert.equal(new Set(p.durations).size, 3);
    assert.equal(p.answer, p.names[p.durations.indexOf(Math.max(...p.durations))]);
    assert.ok(p.durations[0] > 60 && p.durations[0] % 60 !== 0);
  }
});

test("time3: 걸린 시간 — 12시를 넘지 않고 답이 맞다", () => {
  const noNoon = (s: number, e: number) => s >= 13 * 60 || e <= 12 * 60;
  for (const p of byKind("clock_elapsed")) {
    assert.equal(p.answer, p.end - p.start);
    assert.ok(p.answer > 60 && p.answer % 60 !== 0);
    assert.ok(noNoon(p.start, p.end));
  }
  for (const p of byKind("until_clock")) {
    assert.equal(p.answer, p.end - p.start);
    assert.ok(p.answer > 60 && p.answer < 120);
    assert.ok(noNoon(p.start, p.end));
  }
  for (const p of byKind("remaining")) {
    assert.equal(p.answer, p.start + 60 - p.now);
    assert.ok(p.answer > 0 && p.answer < 60);
  }
  for (const p of byKind("match_elapsed")) {
    const dur = (r: { start: number; end: number }) => r.end - r.start;
    assert.equal(p.left.length, 2);
    assert.equal(p.right.length, 3);
    assert.equal(new Set(p.right.map(dur)).size, 3);
    for (const l of p.left) assert.equal(p.right.filter((r) => dur(r) === dur(l)).length, 1);
    for (const r of [...p.left, ...p.right]) assert.ok(noNoon(r.start, r.end));
  }
  for (const p of byKind("draw_end")) assert.equal(p.answer, p.start + p.duration);
  for (const p of byKind("draw_end_repeat")) assert.equal(p.answer, p.start + p.each * p.times);
});
