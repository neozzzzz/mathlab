import test from "node:test";
import assert from "node:assert/strict";
import {
  encodeCalcParams,
  parseCalcParams,
  generateCalcSheet,
  type CalcParams,
} from "../src/lib/math-generator.ts";

// 동작(데이터) 레벨 검증: vertical 설정 페이지가 넘기는 결과값 범위(answerAddMin/Max)가
// 인코딩·파싱·문제 생성까지 실제로 반영되는지 확인한다. 소스 문자열 매칭이 아닌 실행 결과를 본다.

const baseParams: CalcParams = {
  type: "mixed_addition",
  count: 24,
  sheets: 1,
  rangeMin: 11,
  rangeMax: 59,
  opMin: 11,
  opMax: 39,
  answerAddMin: 20,
  answerAddMax: 50,
  layout: "a",
};

test("mixed_addition: 결과값 범위가 쿼리에 인코딩되고 파싱으로 복원된다", () => {
  const query = encodeCalcParams(baseParams);

  assert.match(query, /amnA=20/);
  assert.match(query, /amxA=50/);

  const parsed = parseCalcParams(query);
  assert.ok(parsed, "파싱 결과가 있어야 한다");
  assert.equal(parsed.answerAddMin, 20);
  assert.equal(parsed.answerAddMax, 50);
});

test("mixed_addition: 생성된 모든 문제의 답이 결과값 범위 안에 든다", () => {
  const query = encodeCalcParams(baseParams);
  const parsed = parseCalcParams(query);
  assert.ok(parsed);

  const problems = generateCalcSheet(parsed, query, 0);

  assert.ok(problems.length > 0, "문제가 생성되어야 한다");
  for (const p of problems) {
    assert.equal(p.a + p.b, p.answer);
    assert.ok(
      p.answer >= 20 && p.answer <= 50,
      `답 ${p.answer}(=${p.a}+${p.b})이 20~50 범위를 벗어났다`,
    );
  }
});

test("mixed_addition: 결과값 범위를 좁히면 넓은 범위에서 나오던 큰 합이 제외된다", () => {
  const narrow = { ...baseParams, answerAddMin: 20, answerAddMax: 30 };
  const query = encodeCalcParams(narrow);
  const parsed = parseCalcParams(query);
  assert.ok(parsed);

  const problems = generateCalcSheet(parsed, query, 0);
  for (const p of problems) {
    assert.ok(p.answer >= 20 && p.answer <= 30, `답 ${p.answer}이 20~30 범위를 벗어났다`);
  }
});
