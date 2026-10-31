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
  type TimeSplitProblem,
  type TimeActivityProblem,
  type TimeWordProblem,
  type TimeProblem,
  splitTimeConvertCounts,
  timeConvertCountOptions,
  TIME_ACTIVITIES,
} from "../src/lib/math-generator.ts";

const convertParams: TimeParams = {
  mode: "time_convert",
  formats: ["direct"],
  count: 20,
  sheets: 2,
  minMinutes: 61,
  maxMinutes: 179,
};

const { formats: _formats, ...baseParams } = convertParams;
const compareParams: TimeParams = { ...baseParams, mode: "time_compare" };
const splitParams: TimeParams = { ...baseParams, mode: "time_split", count: 12 };

test("time: 쿼리 인코딩 후 파싱하면 같은 설정으로 복원된다", () => {
  for (const params of [convertParams, compareParams, splitParams]) {
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

test("time_split: 60분 단위로 가른 식과 답이 맞고, 열마다 도움을 줄여 간다", () => {
  const query = encodeTimeParams(splitParams);
  const problems = generateTimeSheet(splitParams, query, 0) as TimeSplitProblem[];
  assert.equal(problems.length, 12);

  for (const p of problems) {
    assert.equal(p.kind, "time_split");
    assert.ok(p.minutes >= 61 && p.minutes <= 179, `범위 밖: ${p.minutes}`);
    assert.notEqual(p.minutes % 60, 0);
    assert.equal(p.hours, Math.floor(p.minutes / 60));
    assert.equal(p.restMinutes, p.minutes % 60);
    // 가운데 식: ○시간을 분으로 바꾼 값 + 나머지 분 = 전체 분
    assert.equal(p.hours * 60 + p.restMinutes, p.minutes);
  }

  // 왼쪽 열은 시간·분 → 분, 오른쪽 열은 분 → 시간·분, 각 열은 모두 보임 → 60분 칸 → 나머지 칸 순
  const blanks = ["none", "none", "hours", "hours", "rest", "rest"];
  assert.deepEqual(
    problems.map((p) => `${p.direction}:${p.blank}`),
    [...blanks.map((b) => `to_minutes:${b}`), ...blanks.map((b) => `to_hours:${b}`)],
  );
  for (const direction of ["to_minutes", "to_hours"]) {
    const values = problems.filter((p) => p.direction === direction).map((p) => p.minutes);
    assert.equal(new Set(values).size, values.length, "한 열 안에서 같은 시간이 반복되면 안 된다");
  }
});

test("time_split: 문제 수가 적어도 세 단계가 모두 나온다", () => {
  const params: TimeParams = { ...splitParams, count: 10 };
  const problems = generateTimeSheet(params, encodeTimeParams(params), 0) as TimeSplitProblem[];
  assert.equal(problems.length, 10);
  for (const direction of ["to_minutes", "to_hours"]) {
    const blanks = new Set(problems.filter((p) => p.direction === direction).map((p) => p.blank));
    assert.deepEqual([...blanks].sort(), ["hours", "none", "rest"]);
  }
});

const mixedParams: TimeParams = { ...convertParams, formats: ["direct", "compare", "activity", "word"], count: 22 };

test("time_convert 형식 섞기: 주소에 형식을 담고, 형식이 없는 예전 주소는 바로 바꾸기로 읽는다", () => {
  const query = encodeTimeParams(mixedParams);
  assert.match(query, /f=dcaw/);
  assert.deepEqual(parseTimeParams(query), mixedParams);

  // 고른 순서와 관계없이 바로 바꾸기 → 더 긴 시간 → 활동 → 문장 순으로 정리한다.
  const shuffled = encodeTimeParams({ ...mixedParams, formats: ["word", "direct"] });
  assert.deepEqual(parseTimeParams(shuffled)?.formats, ["direct", "word"]);

  assert.doesNotMatch(encodeTimeParams(convertParams), /f=/, "바로 바꾸기만 내면 예전 주소 그대로");
  assert.deepEqual(parseTimeParams("m=time_convert&c=20&s=1&mn=61&mx=179")?.formats, ["direct"]);
  assert.equal(parseTimeParams("m=time_convert&c=20&s=1&mn=61&mx=179&f=dx"), null, "알 수 없는 형식");
  assert.equal(parseTimeParams("m=time_convert&c=20&s=1&mn=61&mx=179&f="), null, "빈 형식");
});

test("time_convert 형식 섞기: 22문제 × 4형식은 교재처럼 6·6·6·4로 나눈다", () => {
  assert.deepEqual(splitTimeConvertCounts(22, ["direct", "compare", "activity", "word"]), {
    direct: 6,
    compare: 6,
    activity: 6,
    word: 4,
  });
  assert.deepEqual(splitTimeConvertCounts(12, ["direct", "word"]), { direct: 6, compare: 0, activity: 0, word: 6 });
  assert.deepEqual(splitTimeConvertCounts(26, ["direct"]), { direct: 26, compare: 0, activity: 0, word: 0 });
});

test("time_convert 문제 수 선택지: 바로 바꾸기만이면 예전 그대로, 섞으면 한 장에 들어가는 수만", () => {
  assert.deepEqual(timeConvertCountOptions(["direct"]), [10, 16, 20, 26]);
  assert.deepEqual(timeConvertCountOptions(["direct", "compare", "activity", "word"]), [8, 12, 16, 20, 22]);
  for (const count of timeConvertCountOptions(["activity"])) {
    assert.ok(count <= TIME_ACTIVITIES.length, "활동 그림이 겹치지 않을 만큼만");
  }
});

test("time_convert 형식 섞기: 형식 순서대로 이어 붙이고 각 문제의 답이 맞다", () => {
  const problems = generateTimeSheet(mixedParams, encodeTimeParams(mixedParams), 0) as TimeProblem[];
  assert.equal(problems.length, 22);
  assert.deepEqual(
    problems.map((p) => p.kind),
    [
      ...Array(6).fill("time_convert"),
      ...Array(6).fill("time_compare"),
      ...Array(6).fill("time_activity"),
      ...Array(4).fill("time_word"),
    ],
  );

  const activities = problems.filter((p): p is TimeActivityProblem => p.kind === "time_activity");
  assert.equal(new Set(activities.map((p) => p.activityId)).size, activities.length, "한 장 안에서 활동이 겹치지 않는다");
  const words = problems.filter((p): p is TimeWordProblem => p.kind === "time_word");
  for (const p of [...activities, ...words]) {
    assert.ok(p.minutes >= 61 && p.minutes <= 179);
    assert.notEqual(p.minutes % 60, 0);
    assert.equal(p.hours * 60 + p.restMinutes, p.minutes);
  }
  // 왼쪽 열은 분 → 시간·분, 오른쪽 열은 시간·분 → 분으로 번갈아 낸다.
  assert.deepEqual(
    activities.map((p) => p.direction),
    ["to_hours", "to_minutes", "to_hours", "to_minutes", "to_hours", "to_minutes"],
  );
  assert.deepEqual(words.map((p) => p.direction), ["to_hours", "to_minutes", "to_hours", "to_minutes"]);
});
