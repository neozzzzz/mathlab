import test from "node:test";
import assert from "node:assert/strict";
import {
  encodeTimeParams,
  parseTimeParams,
  generateTimeSheet,
  generateTimeAllSheets,
  formatHoursMinutes,
  type TimeParams,
  type TimeConvertProblem,
  type TimeCompareProblem,
} from "../src/lib/math-generator.ts";

const convertParams: TimeParams = {
  mode: "time_convert",
  count: 20,
  sheets: 2,
  minMinutes: 61,
  maxMinutes: 179,
};

const compareParams: TimeParams = { ...convertParams, mode: "time_compare" };

test("time: 쿼리 인코딩 후 파싱하면 같은 설정으로 복원된다", () => {
  for (const params of [convertParams, compareParams]) {
    const query = encodeTimeParams(params);
    assert.deepEqual(parseTimeParams(query), params);
  }
});

test("time: 잘못된 시간 범위는 파싱하지 않는다", () => {
  const bad = (overrides: Partial<TimeParams>) =>
    parseTimeParams(encodeTimeParams({ ...convertParams, ...overrides }));
  assert.equal(bad({ minMinutes: 59 }), null, "최소 60분 미만");
  assert.equal(bad({ maxMinutes: 601 }), null, "최대 600분 초과");
  assert.equal(bad({ minMinutes: 150, maxMinutes: 100 }), null, "최소 > 최대");
  assert.equal(bad({ minMinutes: 120, maxMinutes: 120 }), null, "60의 배수만 남는 범위");
  assert.equal(parseTimeParams("m=time_unknown&c=10&s=1&mn=61&mx=179"), null, "알 수 없는 유형");
});

test("time: 시간·분 표기 형식", () => {
  assert.equal(formatHoursMinutes(96), "1시간 36분");
  assert.equal(formatHoursMinutes(75), "1시간 15분");
  assert.equal(formatHoursMinutes(45), "45분");
  assert.equal(formatHoursMinutes(120), "2시간");
});

test("time_convert: 범위 안의 시간을 두 방향으로 출제하고 답이 맞다", () => {
  const query = encodeTimeParams(convertParams);
  const problems = generateTimeSheet(convertParams, query, 0) as TimeConvertProblem[];
  assert.equal(problems.length, 20);

  const directions = new Set<string>();
  const keys = new Set<string>();
  for (const p of problems) {
    assert.equal(p.kind, "time_convert");
    assert.ok(p.minutes >= 61 && p.minutes <= 179, `범위 밖: ${p.minutes}`);
    assert.notEqual(p.minutes % 60, 0, "60의 배수는 내지 않는다");
    assert.equal(p.hours, Math.floor(p.minutes / 60));
    assert.equal(p.restMinutes, p.minutes % 60);
    directions.add(p.direction);
    keys.add(`${p.direction}-${p.minutes}`);
  }
  assert.deepEqual([...directions].sort(), ["to_hours", "to_minutes"]);
  // 왼쪽 열(앞 절반)은 시간·분 → 분, 오른쪽 열(뒤 절반)은 분 → 시간·분
  assert.deepEqual(
    problems.map((p) => p.direction),
    [...Array(10).fill("to_minutes"), ...Array(10).fill("to_hours")],
  );
  assert.equal(keys.size, problems.length, "한 장 안에서 같은 문제가 반복되면 안 된다");
});

test("time_compare: 표기 방식이 다른 두 시간 중 더 긴 쪽이 정답이다", () => {
  const query = encodeTimeParams(compareParams);
  const problems = generateTimeSheet(compareParams, query, 0) as TimeCompareProblem[];
  assert.equal(problems.length, 20);

  const longerSides = new Set<string>();
  for (const p of problems) {
    assert.equal(p.kind, "time_compare");
    for (const side of [p.left, p.right]) {
      assert.ok(side.minutes >= 61 && side.minutes <= 179, `범위 밖: ${side.minutes}`);
      assert.notEqual(side.minutes % 60, 0);
    }
    assert.notEqual(p.left.minutes, p.right.minutes, "같은 길이는 비교할 수 없다");
    assert.notEqual(p.left.format, p.right.format, "한쪽은 시간·분, 한쪽은 분으로 표기");
    const expected = p.left.minutes > p.right.minutes ? "left" : "right";
    assert.equal(p.longer, expected);
    longerSides.add(p.longer);
  }
  assert.equal(longerSides.size, 2, "정답 위치가 한쪽으로 치우치지 않는다");
});

test("time: 같은 쿼리는 같은 문제지, 장마다 다른 문제", () => {
  const query = encodeTimeParams(convertParams);
  const sheets = generateTimeAllSheets(convertParams, query);
  assert.equal(sheets.length, 2);
  assert.deepEqual(generateTimeAllSheets(convertParams, query), sheets);
  assert.notDeepEqual(sheets[0], sheets[1]);
});

test("time: 범위가 좁으면 만들 수 있는 만큼만 출제한다", () => {
  const narrow: TimeParams = { ...convertParams, count: 30, minMinutes: 61, maxMinutes: 63 };
  const problems = generateTimeSheet(narrow, encodeTimeParams(narrow), 0);
  // 61·62·63분 × 두 방향 = 6문제
  assert.equal(problems.length, 6);
});
