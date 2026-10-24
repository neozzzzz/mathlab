import test from "node:test";
import assert from "node:assert/strict";
import {
  encodeCalcParams,
  parseCalcParams,
  generateCalcSheet,
  type CalcParams,
} from "../src/lib/math-generator.ts";

// 동작(데이터) 레벨 검증: 구구단 "순서대로" 설정이 인코딩·파싱·문제 생성까지
// 실제로 반영되어, 선택한 단을 n×1부터 n×9까지 순서 그대로 출제하는지 확인한다.

const baseParams: CalcParams = {
  type: "mul",
  count: 18,
  sheets: 1,
  rangeMin: 1,
  rangeMax: 9,
  opMin: 1,
  opMax: 9,
  gugudan: [2, 5],
  gugudanOrdered: true,
  layout: "a",
};

test("gugudan ordered: go 플래그가 쿼리에 인코딩되고 파싱으로 복원된다", () => {
  const query = encodeCalcParams(baseParams);
  assert.match(query, /g=2%2C5|g=2,5/);
  assert.match(query, /go=1/);

  const parsed = parseCalcParams(query);
  assert.ok(parsed, "파싱 결과가 있어야 한다");
  assert.deepEqual(parsed.gugudan, [2, 5]);
  assert.equal(parsed.gugudanOrdered, true);
});

test("gugudan ordered: 선택한 단을 n×1~9 순서 그대로 배치한다", () => {
  const query = encodeCalcParams(baseParams);
  const parsed = parseCalcParams(query);
  assert.ok(parsed);

  const problems = generateCalcSheet(parsed, query, 0);
  assert.equal(problems.length, 18, "2단·5단 각 9문제 = 18문제여야 한다");

  const expected: Array<[number, number]> = [];
  for (const table of [2, 5]) {
    for (let m = 1; m <= 9; m++) expected.push([table, m]);
  }
  problems.forEach((p, i) => {
    assert.equal(p.a, expected[i][0], `${i}번째 단이 순서와 다르다`);
    assert.equal(p.b, expected[i][1], `${i}번째 곱하는 수가 순서와 다르다`);
    assert.equal(p.answer, p.a * p.b);
  });
});

test("gugudan ordered: 문제 수가 조합 수보다 많으면 같은 순서를 반복한다", () => {
  const parsed = parseCalcParams(encodeCalcParams({ ...baseParams, gugudan: [3], count: 12 }));
  assert.ok(parsed);

  const problems = generateCalcSheet(parsed, "seed", 0);
  assert.equal(problems.length, 12);
  // 3×1..9 다음 3×1, 3×2, 3×3 순으로 이어져야 한다
  const seq = problems.map((p) => p.b);
  assert.deepEqual(seq, [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3]);
});

test("gugudan: 순서대로가 아니면(섞어서) 기존처럼 순서가 고정되지 않는다", () => {
  const parsed = parseCalcParams(
    encodeCalcParams({ ...baseParams, gugudan: [2, 3, 4, 5, 6, 7], gugudanOrdered: false, count: 54 }),
  );
  assert.ok(parsed);
  assert.equal(parsed.gugudanOrdered, undefined, "go=1이 없으면 순서대로가 아니어야 한다");

  const problems = generateCalcSheet(parsed, "seed-shuffle", 0);
  assert.equal(problems.length, 54);
  // 섞은 결과는 순수 오름차순 나열과 달라야 한다(고정 시드로 재현 가능한 배치)
  const ordered = problems.every((p, i) => p.a === [2, 3, 4, 5, 6, 7][Math.floor(i / 9)] && p.b === (i % 9) + 1);
  assert.equal(ordered, false, "섞어서 모드는 순서대로 배치와 같으면 안 된다");
});
