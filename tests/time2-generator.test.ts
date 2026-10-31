import test from "node:test";
import assert from "node:assert/strict";
import {
  encodeTime2Params,
  parseTime2Params,
  generateTime2Sheet,
  generateTime2AllSheets,
  splitTime2Counts,
  time2CountOptions,
  formatClockDigits,
  formatClockKorean,
  TIME2_FORMATS,
  type Time2Params,
} from "../src/lib/math-generator.ts";

const allParams: Time2Params = { formats: [...TIME2_FORMATS], count: 6, sheets: 3 };

test("time2: 6문제 × 4형식은 교재 활동지처럼 3·1·1·1로 나눈다", () => {
  assert.deepEqual(splitTime2Counts(6, TIME2_FORMATS), { convert: 3, schedule: 1, clock: 1, end: 1 });
  assert.deepEqual(splitTime2Counts(8, TIME2_FORMATS), { convert: 2, schedule: 2, clock: 2, end: 2 });
  assert.deepEqual(splitTime2Counts(6, ["clock", "end"]), { convert: 0, schedule: 0, clock: 3, end: 3 });
});

test("time2: 주소 인코딩·파싱이 왕복하고 잘못된 값은 거른다", () => {
  const q = encodeTime2Params(allParams);
  assert.deepEqual(parseTime2Params(q), allParams);
  assert.deepEqual(parseTime2Params("f=ek&c=4&s=1"), { formats: ["clock", "end"], count: 4, sheets: 1 });
  assert.equal(parseTime2Params("f=x&c=6&s=1"), null);
  assert.equal(parseTime2Params("c=6&s=1"), null);
  assert.equal(parseTime2Params("f=v&c=99&s=1"), null);
  assert.equal(parseTime2Params("f=v&c=6&s=0"), null);
});

test("time2: 시각은 12시간제로 적는다", () => {
  assert.equal(formatClockDigits(9 * 60), "9:00");
  assert.equal(formatClockDigits(13 * 60 + 5), "1:05");
  assert.equal(formatClockDigits(12 * 60 + 30), "12:30");
  assert.equal(formatClockKorean(12 * 60 + 45), "12시 45분");
  assert.equal(formatClockKorean(13 * 60 + 25), "1시 25분");
  assert.equal(formatClockKorean(16 * 60), "4시");
});

test("time2: 형식 순서대로 문제를 만들고 답이 맞다", () => {
  const q = encodeTime2Params(allParams);
  const sheets = generateTime2AllSheets(allParams, q);
  assert.equal(sheets.length, 3);
  for (const sheet of sheets) {
    assert.deepEqual(sheet.map((p) => p.kind), ["time2_convert", "time2_convert", "time2_convert", "time2_schedule", "time2_clock", "time2_end"]);
    for (const p of sheet) {
      switch (p.kind) {
        case "time2_convert":
          assert.notEqual(p.toMinutes % 60, 0);
          assert.notEqual(p.toHours % 60, 0);
          assert.ok(p.toMinutes > 60 && p.toHours > 60);
          break;
        case "time2_schedule": {
          const [first, rest, second] = p.rows;
          assert.equal(rest.name, "쉬는 시간");
          assert.equal(second.start, first.end! + rest.duration!);
          assert.equal(p.answer, second.end! - first.start!);
          // 시간표 시각은 12시를 넘지 않는다(오전 안 또는 오후 1시 이후).
          assert.ok(first.start! >= 13 * 60 || second.end! <= 12 * 60, `${first.start}~${second.end}`);
          assert.match(p.text, /에서 보낸 시간은 몇 시간 몇 분인지 구해 보세요\.$/);
          break;
        }
        case "time2_clock":
          assert.equal(p.answer, p.end - p.start);
          assert.ok(p.answer > 60 && p.answer < 300 && p.answer % 60 !== 0);
          assert.equal(p.start % 5, 0);
          assert.ok(p.start >= 13 * 60 || p.end <= 12 * 60, `${p.start}~${p.end}`);
          assert.match(p.text, /걸린 시간은 몇 시간 몇 분일까요\?$/);
          break;
        case "time2_end":
          assert.equal(p.answer, p.start + p.duration);
          // 끝난 시각은 시작한 시각과 다른 '시'다.
          assert.notEqual(Math.floor(p.answer / 60), Math.floor(p.start / 60));
          assert.match(p.text, /마친 시각은 몇 시 몇 분일까요\?$/);
          break;
      }
    }
  }
});

test("time2: 이름 뒤 조사를 받침에 맞게 붙인다", () => {
  for (let s = 1; s <= 30; s++) {
    const params: Time2Params = { formats: [...TIME2_FORMATS], count: 8, sheets: 1 };
    for (const p of generateTime2Sheet(params, `seed=${s}`)) {
      if (p.kind === "time2_convert") continue;
      assert.doesNotMatch(p.text, /[준윤린연]는|[준윤린연]가|[준윤린연]네/, p.text);
    }
  }
});

test("time2: 같은 주소는 같은 문제, 장마다 다른 문제", () => {
  const q = encodeTime2Params(allParams);
  assert.deepEqual(generateTime2Sheet(allParams, q, 0), generateTime2Sheet(allParams, q, 0));
  assert.notDeepEqual(generateTime2Sheet(allParams, q, 0), generateTime2Sheet(allParams, q, 1));
});

test("time2: 시계 문제가 한 열에 4개 들어가는 구성은 8문제를 고를 수 없다", () => {
  assert.deepEqual(time2CountOptions(TIME2_FORMATS), [4, 6, 8]);
  assert.deepEqual(time2CountOptions(["convert"]), [4, 6, 8]);
  assert.deepEqual(time2CountOptions(["clock"]), [4, 6]);
  assert.deepEqual(time2CountOptions(["schedule", "clock"]), [4, 6]);
  assert.deepEqual(time2CountOptions(["clock", "end"]), [4, 6]);
});
