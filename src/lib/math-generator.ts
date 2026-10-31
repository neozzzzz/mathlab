export type MatchType = "add" | "sub";
export type CalcType = "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div" | "mixed_addition";

export interface MatchProblem {
  top: number[];
  op: number;
  bottom: number[];
  type: MatchType;
}

export interface MatchParams {
  type: MatchType;
  operands: number[];
  count: number;
  sheets: number;
  rangeMin: number;
  rangeMax: number;
}

export interface CalcParams {
  type: CalcType;
  count: number;
  sheets: number;
  rangeMin: number;
  rangeMax: number;
  opMin: number;
  opMax: number;
  answerMin?: number;
  answerMax?: number;
  answerAddMin?: number;
  answerAddMax?: number;
  answerSubMin?: number;
  answerSubMax?: number;
  answerMulMin?: number;
  answerMulMax?: number;
  answerDivMin?: number;
  answerDivMax?: number;
  gugudan?: number[];
  gugudanOrdered?: boolean;
  layout: "a" | "b";
}

export interface CalcProblem {
  a: number;
  b: number;
  type: CalcType;
  answer: number;
  variant?: "vertical" | "horizontal";
}

export interface Calc3Params {
  type: CalcType;
  count: number;
  sheets: number;
  rangeMin: number;
  rangeMax: number;
  opMin: number;
  opMax: number;
  op2Min: number;
  op2Max: number;
}

export interface Calc3Problem {
  a: number;
  b: number;
  c: number;
  op1: string;
  op2: string;
  answer: number;
}

export interface ScreenshotAdditionProblem {
  a: number;
  b: number;
  leftRoundedA: number;
  leftCorrection: number;
  leftIntermediate: number;
  rightRoundedB: number;
  rightCorrection: number;
  rightIntermediate: number;
  answer: number;
  kind: "screenshot_addition";
}

export interface ScreenshotAdditionParams {
  mode: "screenshot_addition";
  count: number;
  sheets: number;
  firstMin: number;
  firstMax: number;
  secondMin: number;
  secondMax: number;
}

const MAX_COUNT = 100;
const MAX_SHEETS = 10;
const MIN_RANGE = 1;
const MAX_RANGE = 9999;

function parseSource(search: string | URLSearchParams): URLSearchParams {
  return typeof search === "string" ? new URLSearchParams(search) : search;
}

function safeNumber(v: string | null): number | undefined {
  if (v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function isIntInRange(n: number | undefined, min: number, max: number): n is number {
  return n !== undefined && Number.isInteger(n) && n >= min && n <= max;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSeed(tag: string, queryString: string, index = 0): number {
  return hashString(`${tag}:${queryString}:${index}`);
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function shuffleInPlace<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickDistinctNumbers(min: number, max: number, count: number, rng: () => number): number[] {
  const size = max - min + 1;
  if (count >= size) {
    const all = Array.from({ length: size }, (_, i) => min + i);
    return shuffleInPlace(all, rng).slice(0, count);
  }

  const picked = new Set<number>();
  while (picked.size < count) {
    picked.add(randInt(rng, min, max));
  }
  return Array.from(picked);
}

export function encodeMatchParams(params: MatchParams): string {
  return new URLSearchParams({
    t: params.type,
    o: params.operands.join(","),
    c: String(params.count),
    s: String(params.sheets),
    mn: String(params.rangeMin),
    mx: String(params.rangeMax),
  }).toString();
}

export function encodeCalcParams(params: CalcParams): string {
  const encoded = new URLSearchParams({
    t: params.type,
    c: String(params.count),
    s: String(params.sheets),
    mn: String(params.rangeMin),
    mx: String(params.rangeMax),
    omn: String(params.opMin),
    omx: String(params.opMax),
    layout: params.layout,
  });

  if (params.type === "mul" && params.gugudan && params.gugudan.length > 0) {
    encoded.set("g", params.gugudan.join(","));
    if (params.gugudanOrdered) {
      encoded.set("go", "1");
    }
  } else if (params.type === "add_sub") {
    if (params.answerAddMin !== undefined && params.answerAddMax !== undefined) {
      encoded.set("amnA", String(params.answerAddMin));
      encoded.set("amxA", String(params.answerAddMax));
    }
    if (params.answerSubMin !== undefined && params.answerSubMax !== undefined) {
      encoded.set("amnS", String(params.answerSubMin));
      encoded.set("amxS", String(params.answerSubMax));
    }
  } else if (params.type === "mul_div") {
    if (
      params.answerMulMin !== undefined &&
      params.answerMulMax !== undefined &&
      params.answerDivMin !== undefined &&
      params.answerDivMax !== undefined
    ) {
      encoded.set("amnM", String(params.answerMulMin));
      encoded.set("amxM", String(params.answerMulMax));
      encoded.set("amnD", String(params.answerDivMin));
      encoded.set("amxD", String(params.answerDivMax));
    } else if (params.answerMin !== undefined && params.answerMax !== undefined) {
      encoded.set("amn", String(params.answerMin));
      encoded.set("amx", String(params.answerMax));
    }
  } else if (params.type === "mixed_addition") {
    if (params.answerAddMin !== undefined && params.answerAddMax !== undefined) {
      encoded.set("amnA", String(params.answerAddMin));
      encoded.set("amxA", String(params.answerAddMax));
    }
  } else if (params.answerMin !== undefined && params.answerMax !== undefined) {
    encoded.set("amn", String(params.answerMin));
    encoded.set("amx", String(params.answerMax));
  }

  return encoded.toString();
}

export function parseMatchParams(search: string | URLSearchParams): MatchParams | null {
  const p = parseSource(search);
  const t = p.get("t");
  const o = p.get("o");
  const count = safeNumber(p.get("c"));
  const sheets = safeNumber(p.get("s"));
  const rangeMin = safeNumber(p.get("mn"));
  const rangeMax = safeNumber(p.get("mx"));

  if (!t || !o) return null;
  if (t !== "add" && t !== "sub") return null;
  if (!isIntInRange(count, 1, MAX_COUNT)) return null;
  if (!isIntInRange(sheets, 1, MAX_SHEETS)) return null;
  if (!isIntInRange(rangeMin, MIN_RANGE, MAX_RANGE) || !isIntInRange(rangeMax, MIN_RANGE, MAX_RANGE)) return null;
  if (rangeMin > rangeMax) return null;

  const operands = o
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isInteger(n));

  if (operands.length === 0) return null;

  return {
    type: t,
    operands,
    count,
    sheets,
    rangeMin,
    rangeMax,
  };
}

export function generateMatchSheet(params: MatchParams, queryString: string, sheetIndex = 0): MatchProblem[] {
  const rng = mulberry32(buildSeed("match", queryString, sheetIndex));
  const problems: MatchProblem[] = [];
  const used = new Set<string>();
  let attempts = 0;
  const valueCount = Math.min(3, params.rangeMax - params.rangeMin + 1);

  while (problems.length < params.count && attempts < 500) {
    attempts++;
    const op = params.operands[Math.floor(rng() * params.operands.length)];
    const tops = pickDistinctNumbers(params.rangeMin, params.rangeMax, valueCount, rng);

    let valid = true;
    const bottoms = tops.map((n) => {
      const r = params.type === "sub" ? n - op : n + op;
      if (r < 0) valid = false;
      return r;
    });

    if (!valid) continue;

    const key = [...tops].sort((a, b) => a - b).join(",") + params.type + op;
    if (used.has(key)) continue;
    used.add(key);

    problems.push({
      top: tops,
      op,
      bottom: shuffleInPlace([...bottoms], rng),
      type: params.type,
    });
  }

  return problems;
}

export function generateMatchAllSheets(params: MatchParams, queryString: string): MatchProblem[][] {
  return Array.from({ length: params.sheets }, (_, i) => generateMatchSheet(params, queryString, i));
}

export function parseCalcParams(search: string | URLSearchParams): CalcParams | null {
  const p = parseSource(search);
  const t = p.get("t");
  const count = safeNumber(p.get("c"));
  const sheets = safeNumber(p.get("s"));
  const rangeMin = safeNumber(p.get("mn"));
  const rangeMax = safeNumber(p.get("mx"));
  const opMin = safeNumber(p.get("omn"));
  const opMax = safeNumber(p.get("omx"));
  const layout = p.get("layout") ?? "a";

  const parsedAnswerMin = safeNumber(p.get("amn"));
  const parsedAnswerMax = safeNumber(p.get("amx"));
  const parsedAnswerAddMin = safeNumber(p.get("amnA"));
  const parsedAnswerAddMax = safeNumber(p.get("amxA"));
  const parsedAnswerSubMin = safeNumber(p.get("amnS"));
  const parsedAnswerSubMax = safeNumber(p.get("amxS"));
  const parsedAnswerMulMin = safeNumber(p.get("amnM"));
  const parsedAnswerMulMax = safeNumber(p.get("amxM"));
  const parsedAnswerDivMin = safeNumber(p.get("amnD"));
  const parsedAnswerDivMax = safeNumber(p.get("amxD"));
  const rawGugudan = p.get("g");
  const rawGugudanOrdered = p.get("go");

  const validTypes = new Set(["add", "sub", "add_sub", "mul", "div", "mul_div", "mixed_addition"]);
  if (!t || !validTypes.has(t)) return null;
  if (layout !== "a" && layout !== "b") return null;
  if (!isIntInRange(count, 1, MAX_COUNT) || !isIntInRange(sheets, 1, MAX_SHEETS)) return null;
  if (!isIntInRange(rangeMin, MIN_RANGE, MAX_RANGE) || !isIntInRange(rangeMax, MIN_RANGE, MAX_RANGE) || rangeMin > rangeMax) return null;
  if (!isIntInRange(opMin, MIN_RANGE, MAX_RANGE) || !isIntInRange(opMax, MIN_RANGE, MAX_RANGE) || opMin > opMax) return null;

  const hasAnswerRange = parsedAnswerMin !== undefined && parsedAnswerMax !== undefined;
  const hasAddAnswerRange = parsedAnswerAddMin !== undefined && parsedAnswerAddMax !== undefined;
  const hasSubAnswerRange = parsedAnswerSubMin !== undefined && parsedAnswerSubMax !== undefined;
  const hasMulAnswerRange = parsedAnswerMulMin !== undefined && parsedAnswerMulMax !== undefined;
  const hasDivAnswerRange = parsedAnswerDivMin !== undefined && parsedAnswerDivMax !== undefined;

  const finalAnswerAddMin = hasAddAnswerRange ? parsedAnswerAddMin : hasAnswerRange ? parsedAnswerMin : undefined;
  const finalAnswerAddMax = hasAddAnswerRange ? parsedAnswerAddMax : hasAnswerRange ? parsedAnswerMax : undefined;
  const finalAnswerSubMin = hasSubAnswerRange ? parsedAnswerSubMin : hasAnswerRange ? parsedAnswerMin : undefined;
  const finalAnswerSubMax = hasSubAnswerRange ? parsedAnswerSubMax : hasAnswerRange ? parsedAnswerMax : undefined;
  const finalAnswerMulMin = hasMulAnswerRange ? parsedAnswerMulMin : hasAnswerRange ? parsedAnswerMin : undefined;
  const finalAnswerMulMax = hasMulAnswerRange ? parsedAnswerMulMax : hasAnswerRange ? parsedAnswerMax : undefined;
  const finalAnswerDivMin = hasDivAnswerRange ? parsedAnswerDivMin : hasAnswerRange ? parsedAnswerMin : undefined;
  const finalAnswerDivMax = hasDivAnswerRange ? parsedAnswerDivMax : hasAnswerRange ? parsedAnswerMax : undefined;

  const hasMixedAnswerRange = t === "add_sub" && (hasAddAnswerRange || hasSubAnswerRange || hasAnswerRange);
  const hasMixedMulDivAnswerRange = t === "mul_div" && (hasMulAnswerRange || hasDivAnswerRange || hasAnswerRange);
  const hasMixedAdditionAnswerRange = t === "mixed_addition" && (hasAnswerRange || hasAddAnswerRange);

  if (t === "mixed_addition") {
    if (rangeMin < 10 || rangeMax > 99 || opMin < 10 || opMax > 99) {
      return null;
    }
  }

  if (hasMixedAnswerRange) {
    if (
      !isIntInRange(finalAnswerAddMin, MIN_RANGE, MAX_RANGE) ||
      !isIntInRange(finalAnswerAddMax, MIN_RANGE, MAX_RANGE) ||
      !isIntInRange(finalAnswerSubMin, MIN_RANGE, MAX_RANGE) ||
      !isIntInRange(finalAnswerSubMax, MIN_RANGE, MAX_RANGE) ||
      finalAnswerAddMin > finalAnswerAddMax ||
      finalAnswerSubMin > finalAnswerSubMax
    ) {
      return null;
    }
  } else if (t === "mixed_addition") {
    if (hasMixedAdditionAnswerRange) {
      if (
        !isIntInRange(finalAnswerAddMin, MIN_RANGE, MAX_RANGE) ||
        !isIntInRange(finalAnswerAddMax, MIN_RANGE, MAX_RANGE) ||
        finalAnswerAddMin > finalAnswerAddMax
      ) {
        return null;
      }
    }
  } else if (hasMixedMulDivAnswerRange) {
    if (
      !isIntInRange(finalAnswerMulMin, MIN_RANGE, MAX_RANGE) ||
      !isIntInRange(finalAnswerMulMax, MIN_RANGE, MAX_RANGE) ||
      !isIntInRange(finalAnswerDivMin, MIN_RANGE, MAX_RANGE) ||
      !isIntInRange(finalAnswerDivMax, MIN_RANGE, MAX_RANGE) ||
      finalAnswerMulMin > finalAnswerMulMax ||
      finalAnswerDivMin > finalAnswerDivMax
    ) {
      return null;
    }
  } else if (hasAnswerRange) {
    if (
      !isIntInRange(parsedAnswerMin, MIN_RANGE, MAX_RANGE) ||
      !isIntInRange(parsedAnswerMax, MIN_RANGE, MAX_RANGE) ||
      parsedAnswerMin > parsedAnswerMax
    ) {
      return null;
    }
  }

  const gugudan =
    t === "mul" && rawGugudan
      ? rawGugudan
          .split(",")
          .map((n) => Number(n.trim()))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 99)
      : [];

  const gugudanOrdered = gugudan.length > 0 && rawGugudanOrdered === "1";

  return {
    type: t as CalcType,
    count,
    sheets,
    rangeMin,
    rangeMax,
    opMin,
    opMax,
    gugudan: gugudan.length > 0 ? gugudan : undefined,
    gugudanOrdered: gugudanOrdered ? true : undefined,
    answerMin: hasAnswerRange ? parsedAnswerMin : undefined,
    answerMax: hasAnswerRange ? parsedAnswerMax : undefined,
    answerAddMin: finalAnswerAddMin,
    answerAddMax: finalAnswerAddMax,
    answerSubMin: finalAnswerSubMin,
    answerSubMax: finalAnswerSubMax,
    answerMulMin: finalAnswerMulMin,
    answerMulMax: finalAnswerMulMax,
    answerDivMin: finalAnswerDivMin,
    answerDivMax: finalAnswerDivMax,
    layout: layout as "a" | "b",
  };
}

export function generateCalcSheet(params: CalcParams, queryString: string, sheetIndex = 0): CalcProblem[] {
  const rng = mulberry32(buildSeed("calc", queryString, sheetIndex));
  const problems: CalcProblem[] = [];
  const used = new Set<string>();
  let attempts = 0;

  if (params.type === "mixed_addition") {
    while (problems.length < params.count && attempts < 5000) {
      attempts++;
      const a = randInt(rng, Math.max(10, params.rangeMin), Math.min(99, params.rangeMax));
      const b = randInt(rng, Math.max(10, params.opMin), Math.min(99, params.opMax));
      const answer = a + b;

      if (answer < 0) continue;
      const ansMin = params.answerAddMin ?? params.answerMin;
      const ansMax = params.answerAddMax ?? params.answerMax;
      if (ansMin !== undefined && ansMax !== undefined && (answer < ansMin || answer > ansMax)) continue;

      const key = `${a}-${b}`;
      if (used.has(key)) continue;
      used.add(key);

      problems.push({
        a,
        b,
        type: "mixed_addition",
        answer,
        variant: "vertical",
      });
    }

    return problems;
  }

  if (params.type === "mul" && params.gugudan && params.gugudan.length > 0) {
    // 선택한 구구단(단) × 1~9 조합을 만든다. 단은 오름차순, 곱하는 수는 1~9 순서다.
    const multipliers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const combos: Array<{ a: number; b: number }> = [];
    for (const table of params.gugudan) {
      for (const m of multipliers) {
        combos.push({ a: table, b: m });
      }
    }

    if (combos.length === 0) return problems;

    if (params.gugudanOrdered) {
      // 순서대로: 각 단의 n×1~9를 순서 그대로 배치한다. 문제 수가 조합 수보다
      // 많으면 같은 순서를 처음부터 다시 반복해 문제 수를 맞춘다.
      let i = 0;
      while (problems.length < params.count) {
        const combo = combos[i % combos.length];
        problems.push({ a: combo.a, b: combo.b, type: "mul", answer: combo.a * combo.b });
        i++;
      }
      return problems;
    }

    // 섞어서: 조합을 섞은 뒤 문제 수만큼 채운다. 조합 수보다 문제 수가 많으면
    // 다시 섞어 반복하므로, 같은 답이 나와도 문제 수를 맞춘다.
    let pool: Array<{ a: number; b: number }> = [];
    while (problems.length < params.count) {
      if (pool.length === 0) pool = shuffleInPlace([...combos], rng);
      const combo = pool.pop() as { a: number; b: number };
      problems.push({ a: combo.a, b: combo.b, type: "mul", answer: combo.a * combo.b });
    }

    return problems;
  }

  while (problems.length < params.count && attempts < 1000) {
    attempts++;
    let op = params.type as string;
    if (op === "add_sub") op = rng() < 0.5 ? "add" : "sub";
    if (op === "mul_div") op = rng() < 0.5 ? "mul" : "div";

    let a: number;
    let b: number;
    let answer: number;

    if (op === "div") {
      b = randInt(rng, params.opMin, params.opMax);
      if (b === 0) continue;
      const qMin = Math.ceil(params.rangeMin / b);
      const qMax = Math.floor(params.rangeMax / b);
      if (qMin > qMax) continue;
      const q = randInt(rng, qMin, qMax);
      a = b * q;
      answer = q;
    } else {
      a = randInt(rng, params.rangeMin, params.rangeMax);
      b = randInt(rng, params.opMin, params.opMax);
      if (op === "sub") answer = a - b;
      else if (op === "mul") answer = a * b;
      else answer = a + b;
    }

    if (answer < 0) continue;

    if (params.type === "add_sub") {
      if (
        op === "add" &&
        params.answerAddMin !== undefined &&
        params.answerAddMax !== undefined &&
        (answer < params.answerAddMin || answer > params.answerAddMax)
      ) {
        continue;
      }
      if (
        op === "sub" &&
        params.answerSubMin !== undefined &&
        params.answerSubMax !== undefined &&
        (answer < params.answerSubMin || answer > params.answerSubMax)
      ) {
        continue;
      }
    } else if (params.type === "mul_div") {
      if (
        params.answerMulMin !== undefined &&
        params.answerMulMax !== undefined &&
        params.answerDivMin !== undefined &&
        params.answerDivMax !== undefined
      ) {
        if (op === "mul" && (answer < params.answerMulMin || answer > params.answerMulMax)) continue;
        if (op === "div" && (answer < params.answerDivMin || answer > params.answerDivMax)) continue;
      } else if (params.answerMin !== undefined && params.answerMax !== undefined) {
        if (answer < params.answerMin || answer > params.answerMax) continue;
      }
    } else if (params.answerMin !== undefined && params.answerMax !== undefined) {
      if (answer < params.answerMin || answer > params.answerMax) continue;
    }

    const key = `${op}-${a}-${b}`;
    if (used.has(key)) continue;
    used.add(key);

    problems.push({ a, b, type: op as CalcType, answer });
  }

  return problems;
}

export function generateCalcAllSheets(params: CalcParams, queryString: string): CalcProblem[][] {
  return Array.from({ length: params.sheets }, (_, i) => generateCalcSheet(params, queryString, i));
}

function pickOp(type: CalcType, rng: () => number): [string, string] {
  const addSub = () => (rng() < 0.5 ? "+" : "−");
  const mulDiv = () => (rng() < 0.5 ? "×" : "÷");

  switch (type) {
    case "add":
      return ["+", "+"];
    case "sub":
      return ["−", "−"];
    case "add_sub":
      return [addSub(), addSub()];
    case "mul":
      return ["×", "×"];
    case "div":
      return ["÷", "÷"];
    case "mul_div":
      return [mulDiv(), mulDiv()];
    case "mixed_addition":
      return ["+", "+"];
  }
}

function calcResult(a: number, b: number, op: string): number | null {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b !== 0 && a % b === 0 ? a / b : null;
    default:
      return null;
  }
}

export function parseCalc3Params(search: string | URLSearchParams): Calc3Params | null {
  const p = parseSource(search);
  const t = p.get("t");
  const count = safeNumber(p.get("c"));
  const sheets = safeNumber(p.get("s"));
  const rangeMin = safeNumber(p.get("mn"));
  const rangeMax = safeNumber(p.get("mx"));
  const opMin = safeNumber(p.get("omn"));
  const opMax = safeNumber(p.get("omx"));
  const op2Min = safeNumber(p.get("o2mn"));
  const op2Max = safeNumber(p.get("o2mx"));

  const validTypes = new Set(["add", "sub", "add_sub", "mul", "div", "mul_div"]);

  if (!t || !validTypes.has(t)) return null;
  if (!isIntInRange(count, 1, MAX_COUNT) || !isIntInRange(sheets, 1, MAX_SHEETS)) return null;
  if (!isIntInRange(rangeMin, MIN_RANGE, MAX_RANGE) || !isIntInRange(rangeMax, MIN_RANGE, MAX_RANGE) || rangeMin > rangeMax) return null;
  if (!isIntInRange(opMin, MIN_RANGE, MAX_RANGE) || !isIntInRange(opMax, MIN_RANGE, MAX_RANGE) || opMin > opMax) return null;
  if (!isIntInRange(op2Min, MIN_RANGE, MAX_RANGE) || !isIntInRange(op2Max, MIN_RANGE, MAX_RANGE) || op2Min > op2Max) return null;

  return {
    type: t as CalcType,
    count,
    sheets,
    rangeMin,
    rangeMax,
    opMin,
    opMax,
    op2Min,
    op2Max,
  };
}

export function encodeCalc3Params(params: Calc3Params): string {
  return new URLSearchParams({
    t: params.type,
    c: String(params.count),
    s: String(params.sheets),
    mn: String(params.rangeMin),
    mx: String(params.rangeMax),
    omn: String(params.opMin),
    omx: String(params.opMax),
    o2mn: String(params.op2Min),
    o2mx: String(params.op2Max),
  }).toString();
}

export function generateCalc3Sheet(params: Calc3Params, queryString: string, sheetIndex = 0): Calc3Problem[] {
  const rng = mulberry32(buildSeed("calc3", queryString, sheetIndex));
  const problems: Calc3Problem[] = [];
  const used = new Set<string>();
  let attempts = 0;

  while (problems.length < params.count && attempts < 2000) {
    attempts++;
    const [op1, op2] = pickOp(params.type, rng);

    let a: number;
    let b: number;
    let c: number;

    if (op1 === "÷") {
      b = randInt(rng, params.opMin, params.opMax);
      if (b === 0) continue;
      const qMin = Math.ceil(params.rangeMin / b);
      const qMax = Math.floor(params.rangeMax / b);
      if (qMin > qMax || qMin < 1) continue;
      const q = randInt(rng, qMin, qMax);
      a = b * q;
    } else {
      a = randInt(rng, params.rangeMin, params.rangeMax);
      b = randInt(rng, params.opMin, params.opMax);
    }

    const mid = calcResult(a, b, op1);
    if (mid === null || mid < 0) continue;

    if (op2 === "÷") {
      c = randInt(rng, params.op2Min, params.op2Max);
      if (c === 0 || mid % c !== 0) continue;
    } else {
      c = randInt(rng, params.op2Min, params.op2Max);
    }

    const answer = calcResult(mid, c, op2);
    if (answer === null || answer < 0) continue;

    const key = `${a}${op1}${b}${op2}${c}`;
    if (used.has(key)) continue;
    used.add(key);

    problems.push({ a, b, c, op1, op2, answer });
  }

  return problems;
}

export function generateCalc3AllSheets(params: Calc3Params, queryString: string): Calc3Problem[][] {
  return Array.from({ length: params.sheets }, (_, i) => generateCalc3Sheet(params, queryString, i));
}

function roundDownToTens(v: number): number {
  return Math.floor(v / 10) * 10;
}

function roundUpToTens(v: number): number {
  const tens = Math.floor(v / 10) * 10;
  return v % 10 === 0 ? tens : tens + 10;
}

export function encodeScreenshotAdditionParams(params: ScreenshotAdditionParams): string {
  return new URLSearchParams({
    mode: params.mode,
    c: String(params.count),
    s: String(params.sheets),
    fmn: String(params.firstMin),
    fmx: String(params.firstMax),
    smn: String(params.secondMin),
    smx: String(params.secondMax),
  }).toString();
}

export function parseScreenshotAdditionParams(search: string | URLSearchParams): ScreenshotAdditionParams | null {
  const p = parseSource(search);
  const mode = p.get("mode");
  if (mode !== "screenshot_addition") return null;

  const count = safeNumber(p.get("c"));
  const sheets = safeNumber(p.get("s"));
  const firstMin = safeNumber(p.get("fmn"));
  const firstMax = safeNumber(p.get("fmx"));
  const secondMin = safeNumber(p.get("smn"));
  const secondMax = safeNumber(p.get("smx"));

  if (!isIntInRange(count, 1, MAX_COUNT) || !isIntInRange(sheets, 1, MAX_SHEETS)) return null;
  if (!isIntInRange(firstMin, 10, 99) || !isIntInRange(firstMax, 10, 99) || firstMin > firstMax) return null;
  if (!isIntInRange(secondMin, 10, 99) || !isIntInRange(secondMax, 10, 99) || secondMin > secondMax) return null;

  return {
    mode: "screenshot_addition",
    count,
    sheets,
    firstMin,
    firstMax,
    secondMin,
    secondMax,
  };
}

export function generateScreenshotAdditionSheet(
  params: ScreenshotAdditionParams,
  queryString: string,
  sheetIndex = 0,
): ScreenshotAdditionProblem[] {
  const rng = mulberry32(buildSeed("screenshot_addition", queryString, sheetIndex));
  const problems: ScreenshotAdditionProblem[] = [];
  const used = new Set<string>();
  let attempts = 0;

  while (problems.length < params.count && attempts < 3000) {
    attempts++;
    const a = randInt(rng, params.firstMin, params.firstMax);
    const b = randInt(rng, params.secondMin, params.secondMax);

    if (a < 10 || a > 99 || b < 10 || b > 99) continue;
    // 1의 자리가 0인 수는 보정값이 0이 되어 학습 포맷 의미가 약해지므로 제외
    if (a % 10 === 0 || b % 10 === 0) continue;

    const leftRoundedA = a - Math.floor(a / 10);
    const leftCorrection = a - leftRoundedA;
    const leftIntermediate = leftCorrection + b;
    const rightRoundedB = roundUpToTens(b);
    const rightCorrection = rightRoundedB - b;
    const rightIntermediate = a + rightRoundedB;
    const answer = a + b;

    const key = `${a}-${b}`;
    if (used.has(key)) continue;
    used.add(key);

    problems.push({
      a,
      b,
      leftRoundedA,
      leftCorrection,
      leftIntermediate,
      rightRoundedB,
      rightCorrection,
      rightIntermediate,
      answer,
      kind: "screenshot_addition",
    });
  }

  return problems;
}

export function generateScreenshotAdditionAllSheets(
  params: ScreenshotAdditionParams,
  queryString: string,
): ScreenshotAdditionProblem[][] {
  return Array.from({ length: params.sheets }, (_, i) => generateScreenshotAdditionSheet(params, queryString, i));
}

// ── 시간 단위 변환·비교 ─────────────────────────────────────────────

export type TimeMode = "time_convert" | "time_compare" | "time_split";

/**
 * 단위 바꾸기 문제지에 섞어 넣는 형식(교재 "1시간 알아보기" 한 쪽의 네 가지 문제).
 * direct: 1시간 36분 = [ ]분 / compare: 더 긴 시간에 O 표 /
 * activity: 활동에 걸린 시간 95분 → [ ]시간 [ ]분 / word: 87분은 몇 시간 몇 분인가요?
 */
export type TimeConvertFormat = "direct" | "compare" | "activity" | "word";

export const TIME_CONVERT_FORMATS: readonly TimeConvertFormat[] = ["direct", "compare", "activity", "word"];

export interface TimeParams {
  mode: TimeMode;
  /** time_convert 에서만 쓴다. 고른 순서와 관계없이 TIME_CONVERT_FORMATS 순으로 정렬해 둔다. */
  formats?: TimeConvertFormat[];
  count: number;
  sheets: number;
  /** 출제 범위 최소 시간(분) */
  minMinutes: number;
  /** 출제 범위 최대 시간(분) */
  maxMinutes: number;
}

/** 1시간 36분 = [ ]분 (to_minutes) / 75분 = [ ]시간 [ ]분 (to_hours) */
export interface TimeConvertProblem {
  kind: "time_convert";
  direction: "to_minutes" | "to_hours";
  minutes: number;
  hours: number;
  restMinutes: number;
}

export interface TimeValue {
  minutes: number;
  /** hm: ○시간 ○분, m: ○분 */
  format: "hm" | "m";
}

/** 두 시간 중 더 긴 쪽에 O 표 */
export interface TimeCompareProblem {
  kind: "time_compare";
  left: TimeValue;
  right: TimeValue;
  longer: "left" | "right";
}

/**
 * 1시간 = 60분을 이용해 두 단계로 바꾸기.
 * to_minutes: 1시간 10분 = 60분 + 10분 = [ ]분
 * to_hours:   75분 = 60분 + 15분 = 1시간 [ ]분
 * blank 는 가운데 식에서 비우는 칸 — none: 모두 보임, hours: [ ]분 + 10분, rest: 60분 + [ ]분.
 * 가운데 식이 모두 보이면(none) to_hours 의 마지막 식은 시간을 적어 주고 분만 비운다.
 */
export interface TimeSplitProblem {
  kind: "time_split";
  direction: "to_minutes" | "to_hours";
  minutes: number;
  hours: number;
  restMinutes: number;
  blank: "none" | "hours" | "rest";
}

export interface TimeActivity {
  id: string;
  name: string;
}

/** 문제지에 쓰는 활동. 그림은 미리보기에서 id 별 아이콘으로 그린다. */
export const TIME_ACTIVITIES: readonly TimeActivity[] = [
  { id: "drawing", name: "그림 그리기" },
  { id: "piano", name: "피아노 연습" },
  { id: "reading", name: "책 읽기" },
  { id: "swimming", name: "수영하기" },
  { id: "tv", name: "텔레비전 보기" },
  { id: "bike", name: "자전거 타기" },
  { id: "exercise", name: "운동하기" },
  { id: "homework", name: "숙제하기" },
  { id: "walking", name: "산책하기" },
  { id: "puzzle", name: "퍼즐 맞추기" },
  { id: "cooking", name: "요리하기" },
  { id: "movie", name: "영화 보기" },
];

/** 활동에 걸린 시간을 다른 단위로 바꾸기. to_minutes: 1시간 40분 → [ ]분, to_hours: 95분 → [ ]시간 [ ]분 */
export interface TimeActivityProblem {
  kind: "time_activity";
  activityId: string;
  activityName: string;
  direction: "to_minutes" | "to_hours";
  minutes: number;
  hours: number;
  restMinutes: number;
}

/** 문장 문제. to_hours: 87분은 몇 시간 몇 분인가요? / to_minutes: 1시간 20분은 몇 분인가요? */
export interface TimeWordProblem {
  kind: "time_word";
  direction: "to_minutes" | "to_hours";
  minutes: number;
  hours: number;
  restMinutes: number;
}

export type TimeProblem =
  | TimeConvertProblem
  | TimeCompareProblem
  | TimeSplitProblem
  | TimeActivityProblem
  | TimeWordProblem;

export const TIME_MIN_MINUTES = 60;
export const TIME_MAX_MINUTES = 600;

const TIME_MODES: readonly TimeMode[] = ["time_convert", "time_compare", "time_split"];

export function formatHoursMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

export function formatTimeValue(value: TimeValue): string {
  return value.format === "m" ? `${value.minutes}분` : formatHoursMinutes(value.minutes);
}

/** 60의 배수는 "○시간 0분"이 되어 변환 문제로 의미가 약하므로 출제하지 않는다. */
function timeCandidates(minMinutes: number, maxMinutes: number): number[] {
  const values: number[] = [];
  for (let v = minMinutes; v <= maxMinutes; v++) {
    if (v % 60 !== 0) values.push(v);
  }
  return values;
}

const TIME_FORMAT_CODES: Record<TimeConvertFormat, string> = { direct: "d", compare: "c", activity: "a", word: "w" };

/** 형식을 정해진 순서로 정렬하고 중복을 없앤다. 비어 있으면 바로 바꾸기만 낸다. */
export function normalizeTimeConvertFormats(formats: readonly TimeConvertFormat[] | undefined): TimeConvertFormat[] {
  const picked = TIME_CONVERT_FORMATS.filter((f) => formats?.includes(f));
  return picked.length > 0 ? picked : ["direct"];
}

/**
 * 고른 형식마다 문제 수를 나눈다. 두 열로 놓으므로 2문제씩 나누고, 남는 문제는 앞 형식부터 2개씩 더 준다.
 * 예: 22문제 × 4형식 → 6·6·6·4 (교재 한 쪽과 같은 구성)
 */
export function splitTimeConvertCounts(count: number, formats: readonly TimeConvertFormat[]): Record<TimeConvertFormat, number> {
  const result: Record<TimeConvertFormat, number> = { direct: 0, compare: 0, activity: 0, word: 0 };
  const list = normalizeTimeConvertFormats(formats);
  if (list.length === 1) {
    result[list[0]] = count;
    return result;
  }
  const base = Math.floor(count / (2 * list.length)) * 2;
  let rest = count - base * list.length;
  for (const f of list) {
    const extra = Math.min(rest, 2);
    result[f] = base + extra;
    rest -= extra;
  }
  return result;
}

/** A4 한 장에서 형식별 한 줄(두 문제)이 차지하는 대략의 높이(px)와 구역 머리말 높이. */
const TIME_FORMAT_ROW_PX: Record<TimeConvertFormat, number> = { direct: 52, compare: 60, activity: 78, word: 72 };
const TIME_SECTION_HEADER_PX = 44;
const TIME_SHEET_BODY_PX = 900;

/** 바로 바꾸기만 고르면 예전과 같은 선택지, 여러 형식을 섞으면 한 장에 들어가는 문제 수만 보여 준다. */
export function timeConvertCountOptions(formats: readonly TimeConvertFormat[]): number[] {
  const list = normalizeTimeConvertFormats(formats);
  if (list.length === 1 && list[0] === "direct") return [10, 16, 20, 26];
  const candidates = list.length === 1 ? [10, 12, 16, 20] : [8, 12, 16, 20, 22, 24];
  return candidates.filter((count) => {
    const counts = splitTimeConvertCounts(count, list);
    const header = list.length > 1 ? TIME_SECTION_HEADER_PX * list.length : 0;
    const body = list.reduce((sum, f) => sum + Math.ceil(counts[f] / 2) * TIME_FORMAT_ROW_PX[f], 0);
    // 활동 그림은 서로 달라야 하므로 활동 수보다 많이 낼 수 없다.
    return header + body <= TIME_SHEET_BODY_PX && counts.activity <= TIME_ACTIVITIES.length;
  });
}

export function encodeTimeParams(params: TimeParams): string {
  const query = new URLSearchParams({
    m: params.mode,
    c: String(params.count),
    s: String(params.sheets),
    mn: String(params.minMinutes),
    mx: String(params.maxMinutes),
  });
  // 바로 바꾸기만 내는 기본 구성은 예전 주소와 같게 둔다.
  const formats = normalizeTimeConvertFormats(params.formats);
  if (params.mode === "time_convert" && !(formats.length === 1 && formats[0] === "direct")) {
    query.set("f", formats.map((f) => TIME_FORMAT_CODES[f]).join(""));
  }
  return query.toString();
}

function parseTimeConvertFormats(raw: string | null): TimeConvertFormat[] | null {
  if (raw === null) return ["direct"];
  const formats: TimeConvertFormat[] = [];
  for (const code of raw) {
    const format = TIME_CONVERT_FORMATS.find((f) => TIME_FORMAT_CODES[f] === code);
    if (!format) return null;
    formats.push(format);
  }
  return formats.length > 0 ? normalizeTimeConvertFormats(formats) : null;
}

export function parseTimeParams(search: string | URLSearchParams): TimeParams | null {
  const p = parseSource(search);
  const mode = p.get("m") as TimeMode | null;
  if (!mode || !TIME_MODES.includes(mode)) return null;

  const count = safeNumber(p.get("c"));
  const sheets = safeNumber(p.get("s"));
  const minMinutes = safeNumber(p.get("mn"));
  const maxMinutes = safeNumber(p.get("mx"));

  if (!isIntInRange(count, 1, MAX_COUNT) || !isIntInRange(sheets, 1, MAX_SHEETS)) return null;
  if (!isIntInRange(minMinutes, TIME_MIN_MINUTES, TIME_MAX_MINUTES)) return null;
  if (!isIntInRange(maxMinutes, TIME_MIN_MINUTES, TIME_MAX_MINUTES)) return null;
  if (minMinutes > maxMinutes || timeCandidates(minMinutes, maxMinutes).length === 0) return null;

  if (mode !== "time_convert") return { mode, count, sheets, minMinutes, maxMinutes };
  const formats = parseTimeConvertFormats(p.get("f"));
  if (!formats) return null;
  return { mode, formats, count, sheets, minMinutes, maxMinutes };
}

/**
 * 앞 절반은 "○시간 ○분 = [ ]분", 뒤 절반은 "○분 = [ ]시간 [ ]분".
 * 문제지에서 왼쪽 열·오른쪽 열로 유형을 나눠 배치한다(홀수면 왼쪽이 하나 더 많음).
 */
function generateTimeDirectProblems(params: TimeParams, count: number, rng: () => number): TimeConvertProblem[] {
  const toMinutesCount = Math.ceil(count / 2);
  const toHoursCount = count - toMinutesCount;
  const pick = (direction: TimeConvertProblem["direction"], n: number): TimeConvertProblem[] =>
    shuffleInPlace(timeCandidates(params.minMinutes, params.maxMinutes), rng)
      .slice(0, n)
      .map((minutes) => ({
        kind: "time_convert",
        direction,
        minutes,
        hours: Math.floor(minutes / 60),
        restMinutes: minutes % 60,
      }));

  return [...pick("to_minutes", toMinutesCount), ...pick("to_hours", toHoursCount)];
}

function generateTimeCompareSheet(params: TimeParams, rng: () => number, count = params.count): TimeCompareProblem[] {
  const candidates = timeCandidates(params.minMinutes, params.maxMinutes);
  const problems: TimeCompareProblem[] = [];
  if (candidates.length < 2) return problems;

  const used = new Set<string>();
  let attempts = 0;
  while (problems.length < count && attempts < 5000) {
    attempts++;
    const a = candidates[randInt(rng, 0, candidates.length - 1)];
    const b = candidates[randInt(rng, 0, candidates.length - 1)];
    if (a === b) continue;

    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (used.has(key)) continue;
    used.add(key);

    // 한쪽은 "○시간 ○분", 다른 쪽은 "○분"으로 적어 단위를 바꿔 비교하게 한다.
    const aFormat: TimeValue["format"] = rng() < 0.5 ? "hm" : "m";
    const left: TimeValue = { minutes: a, format: aFormat };
    const right: TimeValue = { minutes: b, format: aFormat === "hm" ? "m" : "hm" };
    problems.push({ kind: "time_compare", left, right, longer: a > b ? "left" : "right" });
  }
  return problems;
}

/** 두 방향을 번갈아 낸다(왼쪽 열 문제와 오른쪽 열 문제가 서로 다른 방향이 되도록). */
function pickAlternating(params: TimeParams, count: number, rng: () => number) {
  return shuffleInPlace(timeCandidates(params.minMinutes, params.maxMinutes), rng)
    .slice(0, count)
    .map((minutes, i) => ({
      direction: (i % 2 === 0 ? "to_hours" : "to_minutes") as "to_hours" | "to_minutes",
      minutes,
      hours: Math.floor(minutes / 60),
      restMinutes: minutes % 60,
    }));
}

function generateTimeActivityProblems(params: TimeParams, count: number, rng: () => number): TimeActivityProblem[] {
  const activities = shuffleInPlace([...TIME_ACTIVITIES], rng);
  return pickAlternating(params, Math.min(count, activities.length), rng).map((base, i) => ({
    kind: "time_activity",
    activityId: activities[i].id,
    activityName: activities[i].name,
    ...base,
  }));
}

function generateTimeWordProblems(params: TimeParams, count: number, rng: () => number): TimeWordProblem[] {
  return pickAlternating(params, count, rng).map((base) => ({ kind: "time_word", ...base }));
}

/** 고른 형식을 정해진 순서(바로 바꾸기 → 더 긴 시간 → 활동 → 문장)로 이어 붙인다. */
function generateTimeConvertSheet(params: TimeParams, rng: () => number): TimeProblem[] {
  const counts = splitTimeConvertCounts(params.count, normalizeTimeConvertFormats(params.formats));
  const problems: TimeProblem[] = [];
  if (counts.direct > 0) problems.push(...generateTimeDirectProblems(params, counts.direct, rng));
  if (counts.compare > 0) problems.push(...generateTimeCompareSheet(params, rng, counts.compare));
  if (counts.activity > 0) problems.push(...generateTimeActivityProblems(params, counts.activity, rng));
  if (counts.word > 0) problems.push(...generateTimeWordProblems(params, counts.word, rng));
  return problems;
}

const TIME_SPLIT_BLANKS: readonly TimeSplitProblem["blank"][] = ["none", "hours", "rest"];

/**
 * 단위 바꾸기와 같이 왼쪽 열(앞 절반)은 시간·분 → 분, 오른쪽 열(뒤 절반)은 분 → 시간·분.
 * 각 열은 위에서부터 "가운데 식 모두 보임 → 60분 칸 비움 → 나머지 분 칸 비움" 순으로
 * 도움을 줄여 간다(교재의 1시간 알아보기 순서).
 */
function generateTimeSplitSheet(params: TimeParams, rng: () => number): TimeSplitProblem[] {
  const toMinutesCount = Math.ceil(params.count / 2);
  const toHoursCount = params.count - toMinutesCount;
  const pick = (direction: TimeSplitProblem["direction"], n: number): TimeSplitProblem[] => {
    const values = shuffleInPlace(timeCandidates(params.minMinutes, params.maxMinutes), rng).slice(0, n);
    return values.map((minutes, i) => ({
      kind: "time_split",
      direction,
      minutes,
      hours: Math.floor(minutes / 60),
      restMinutes: minutes % 60,
      blank: TIME_SPLIT_BLANKS[Math.floor((i * TIME_SPLIT_BLANKS.length) / values.length)],
    }));
  };

  return [...pick("to_minutes", toMinutesCount), ...pick("to_hours", toHoursCount)];
}

export function generateTimeSheet(params: TimeParams, queryString: string, sheetIndex = 0): TimeProblem[] {
  const rng = mulberry32(buildSeed(params.mode, queryString, sheetIndex));
  switch (params.mode) {
    case "time_convert":
      return generateTimeConvertSheet(params, rng);
    case "time_compare":
      return generateTimeCompareSheet(params, rng);
    case "time_split":
      return generateTimeSplitSheet(params, rng);
  }
}

export function generateTimeAllSheets(params: TimeParams, queryString: string): TimeProblem[][] {
  return Array.from({ length: params.sheets }, (_, i) => generateTimeSheet(params, queryString, i));
}

// ── 시간 2: 걸린 시간 알아보기 ─────────────────────────────────────
// 교재 수학 2-2 「4. 시각과 시간 ⑥ 걸린 시간을 알아볼까요」 확인 문제 한 쪽의 네 가지 문제.
// 시각은 12시간제(1~12시)로 적는다. 시각 값은 0시 기준 분(0~1439)으로 다루고 화면에 낼 때 바꾼다.

/**
 * convert: (1) 1시간 20분 = [ ]분 (2) 100분 = [ ]시간 [ ]분
 * schedule: 체험 시간표를 보고 보낸 시간 구하기
 * clock: 시작한 시각·끝난 시각 시계를 보고 걸린 시간 구하기
 * end: 시작 시각과 걸린 시간을 주고 끝난 시각 구하기
 */
export type Time2Format = "convert" | "schedule" | "clock" | "end";

export const TIME2_FORMATS: readonly Time2Format[] = ["convert", "schedule", "clock", "end"];

const TIME2_FORMAT_CODES: Record<Time2Format, string> = { convert: "v", schedule: "t", clock: "k", end: "e" };

/** 한 장에 넣을 수 있는 문제 수. 교재 한 쪽은 6문제. */
export const TIME2_COUNT_OPTIONS: readonly number[] = [4, 6, 8];

export interface Time2Params {
  formats: Time2Format[];
  count: number;
  sheets: number;
}

/** 단위 바꾸기 한 문제 = (1) 시간·분 → 분, (2) 분 → 시간·분 두 칸 */
export interface Time2ConvertProblem {
  kind: "time2_convert";
  toMinutes: number;
  toHours: number;
}

export interface Time2ScheduleRow {
  name: string;
  /** 활동이면 시작·끝 시각, 쉬는 시간이면 duration 만 둔다. */
  start?: number;
  end?: number;
  duration?: number;
}

export interface Time2ScheduleProblem {
  kind: "time2_schedule";
  text: string;
  rows: Time2ScheduleRow[];
  /** 정답(분): 첫 활동 시작부터 마지막 활동 끝까지 */
  answer: number;
}

export interface Time2ClockProblem {
  kind: "time2_clock";
  text: string;
  start: number;
  end: number;
  answer: number;
}

export interface Time2EndProblem {
  kind: "time2_end";
  text: string;
  start: number;
  duration: number;
  /** 정답 시각(분) */
  answer: number;
}

export type Time2Problem = Time2ConvertProblem | Time2ScheduleProblem | Time2ClockProblem | Time2EndProblem;

/** 9:00, 1:30 처럼 시간표에 적는 시각(12시간제) */
export function formatClockDigits(minuteOfDay: number): string {
  const m = ((minuteOfDay % 1440) + 1440) % 1440;
  const hour = Math.floor(m / 60) % 12 || 12;
  return `${hour}:${String(m % 60).padStart(2, "0")}`;
}

/** 12시 45분, 4시 처럼 문장에 적는 시각(12시간제) */
export function formatClockKorean(minuteOfDay: number): string {
  const m = ((minuteOfDay % 1440) + 1440) % 1440;
  const hour = Math.floor(m / 60) % 12 || 12;
  return m % 60 === 0 ? `${hour}시` : `${hour}시 ${m % 60}분`;
}

/** 마지막 글자에 받침이 있는지 */
function hasBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

/** 이름 부르기: 민준 → 민준이, 시아 → 시아 (뒤에 는/가 를 붙여 쓴다) */
function callName(name: string): string {
  return hasBatchim(name) ? `${name}이` : name;
}

function objectParticle(word: string): string {
  return hasBatchim(word) ? "을" : "를";
}

const TIME2_CHILDREN = ["시아", "주아", "소민", "민준", "서연", "도윤", "하은", "지호", "예린", "준서", "유나", "태오"];

const TIME2_SCHEDULE_PLACES: readonly { place: string; activities: [string, string] }[] = [
  { place: "우주 체험관", activities: ["우주인 체험", "우주선 만들기"] },
  { place: "과학관", activities: ["로봇 체험", "별자리 관찰"] },
  { place: "미술관", activities: ["그림 감상", "도자기 만들기"] },
  { place: "도서관", activities: ["책 읽기", "독서 퀴즈"] },
  { place: "동물원", activities: ["동물 구경", "먹이 주기 체험"] },
  { place: "박물관", activities: ["유물 관람", "탁본 체험"] },
  { place: "농장", activities: ["딸기 따기", "치즈 만들기"] },
];

const TIME2_CLOCK_ACTIVITIES: readonly { noun: string; doing: string }[] = [
  { noun: "청소", doing: "청소하는" },
  { noun: "등산", doing: "등산하는" },
  { noun: "김장", doing: "김장하는" },
  { noun: "캠핑 준비", doing: "캠핑을 준비하는" },
  { noun: "집 정리", doing: "집을 정리하는" },
  { noun: "자전거 여행", doing: "자전거 여행을 하는" },
];

/** 끝난 시각 구하기 문장. 시작 시각 범위(0시 기준 분)와 걸린 시간 범위(분)는 생활에 맞게 정했다. */
const TIME2_END_ACTIVITIES: readonly {
  begin: string;
  during: string;
  finish: string;
  start: [number, number];
  duration: [number, number];
}[] = [
  { begin: "점심을 먹기 시작하여", during: "점심을 먹었습니다", finish: "점심 식사를 마친", start: [11 * 60 + 30, 12 * 60 + 50], duration: [25, 50] },
  { begin: "숙제를 하기 시작하여", during: "숙제를 했습니다", finish: "숙제를 마친", start: [15 * 60, 17 * 60 + 50], duration: [30, 90] },
  { begin: "피아노 연습을 시작하여", during: "피아노 연습을 했습니다", finish: "피아노 연습을 마친", start: [14 * 60, 17 * 60 + 50], duration: [30, 80] },
  { begin: "책을 읽기 시작하여", during: "책을 읽었습니다", finish: "책 읽기를 마친", start: [9 * 60, 16 * 60 + 50], duration: [25, 75] },
  { begin: "축구를 하기 시작하여", during: "축구를 했습니다", finish: "축구를 마친", start: [9 * 60 + 30, 16 * 60 + 50], duration: [40, 100] },
  { begin: "영화를 보기 시작하여", during: "영화를 보았습니다", finish: "영화 보기를 마친", start: [10 * 60, 16 * 60 + 50], duration: [90, 140] },
];

/**
 * 12시를 지나는지(예: 11:30~1:10, 12:40~2:10). 시간표·시계 문제는 12시간제로 적으므로
 * 12시를 넘기면 시각의 차를 바로 구하기 어려워 내지 않는다. 끝난 시각 구하기는 교재처럼 넘겨도 된다.
 */
function crossesNoon(start: number, end: number): boolean {
  return start < 13 * 60 && end > 12 * 60;
}

/** 고른 형식을 정해진 순서로 정렬하고 중복을 없앤다. 비어 있으면 네 형식을 모두 낸다. */
export function normalizeTime2Formats(formats: readonly Time2Format[] | undefined): Time2Format[] {
  const picked = TIME2_FORMATS.filter((f) => formats?.includes(f));
  return picked.length > 0 ? picked : [...TIME2_FORMATS];
}

/**
 * 고른 형식마다 같은 수를 나누고 남는 문제는 맨 앞 형식에 준다.
 * 예: 6문제 × 4형식 → 3·1·1·1 (교재 한 쪽과 같은 구성), 8문제 × 4형식 → 2·2·2·2
 */
export function splitTime2Counts(count: number, formats: readonly Time2Format[]): Record<Time2Format, number> {
  const result: Record<Time2Format, number> = { convert: 0, schedule: 0, clock: 0, end: 0 };
  const list = normalizeTime2Formats(formats);
  const base = Math.floor(count / list.length);
  list.forEach((f) => {
    result[f] = base;
  });
  result[list[0]] += count - base * list.length;
  return result;
}

/** A4 한 장에서 형식별 한 문제가 차지하는 대략의 높이(px). 문장이 한 줄 더 늘어나는 경우까지 넉넉히 잡았다. */
const TIME2_PROBLEM_PX: Record<Time2Format, number> = { convert: 120, schedule: 215, clock: 245, end: 160 };
const TIME2_PROBLEM_GAP_PX = 12;
const TIME2_COLUMN_PX = 935;

/** 고른 형식으로 한 장에 들어가는 문제 수만 고른다(왼쪽 열을 먼저 채우고 오른쪽 열로 넘어간다). */
export function time2CountOptions(formats: readonly Time2Format[]): number[] {
  const list = normalizeTime2Formats(formats);
  return TIME2_COUNT_OPTIONS.filter((count) => {
    const counts = splitTime2Counts(count, list);
    const order = list.flatMap((f) => Array.from({ length: counts[f] }, () => f));
    const half = Math.ceil(order.length / 2);
    return [order.slice(0, half), order.slice(half)].every(
      (column) =>
        column.reduce((sum, f) => sum + TIME2_PROBLEM_PX[f], 0) + TIME2_PROBLEM_GAP_PX * Math.max(column.length - 1, 0) <=
        TIME2_COLUMN_PX,
    );
  });
}

export function encodeTime2Params(params: Time2Params): string {
  return new URLSearchParams({
    f: normalizeTime2Formats(params.formats).map((f) => TIME2_FORMAT_CODES[f]).join(""),
    c: String(params.count),
    s: String(params.sheets),
  }).toString();
}

export function parseTime2Params(search: string | URLSearchParams): Time2Params | null {
  const p = parseSource(search);
  const raw = p.get("f");
  if (!raw) return null;
  const formats: Time2Format[] = [];
  for (const code of raw) {
    const format = TIME2_FORMATS.find((f) => TIME2_FORMAT_CODES[f] === code);
    if (!format) return null;
    formats.push(format);
  }
  const count = safeNumber(p.get("c"));
  const sheets = safeNumber(p.get("s"));
  if (!isIntInRange(count, 1, Math.max(...TIME2_COUNT_OPTIONS))) return null;
  if (!isIntInRange(sheets, 1, MAX_SHEETS)) return null;
  return { formats: normalizeTime2Formats(formats), count, sheets };
}

/** 5분 단위, 60의 배수가 아닌 시간(65~235분) */
const TIME2_CONVERT_VALUES = Array.from({ length: 35 }, (_, i) => 65 + i * 5).filter((v) => v % 60 !== 0);

function generateTime2Convert(count: number, rng: () => number): Time2ConvertProblem[] {
  const a = shuffleInPlace([...TIME2_CONVERT_VALUES], rng);
  const b = shuffleInPlace([...TIME2_CONVERT_VALUES], rng);
  return Array.from({ length: count }, (_, i) => ({
    kind: "time2_convert",
    toMinutes: a[i % a.length],
    toHours: b[i % b.length],
  }));
}

/** step 단위로 [min, max] 사이 값을 고른다. */
function randStep(rng: () => number, min: number, max: number, step: number): number {
  return min + randInt(rng, 0, Math.floor((max - min) / step)) * step;
}

function generateTime2Schedule(count: number, rng: () => number): Time2ScheduleProblem[] {
  const places = shuffleInPlace([...TIME2_SCHEDULE_PLACES], rng);
  const children = shuffleInPlace([...TIME2_CHILDREN], rng);
  return Array.from({ length: count }, (_, i) => {
    const { place, activities } = places[i % places.length];
    let start = 0;
    let first = 0;
    let rest = 0;
    let second = 0;
    for (let tries = 0; tries < 100; tries++) {
      start = randStep(rng, 9 * 60, 14 * 60, 10);
      first = randStep(rng, 40, 90, 10);
      rest = randStep(rng, 10, 20, 10);
      second = randStep(rng, 40, 90, 10);
      if (!crossesNoon(start, start + first + rest + second)) break;
    }
    const secondStart = start + first + rest;
    const end = secondStart + second;
    return {
      kind: "time2_schedule",
      text: `체험 시간표를 보고 ${callName(children[i % children.length])}가 ${place}에서 보낸 시간은 몇 시간 몇 분인지 구해 보세요.`,
      rows: [
        { name: activities[0], start, end: start + first },
        { name: "쉬는 시간", duration: rest },
        { name: activities[1], start: secondStart, end },
      ],
      answer: end - start,
    };
  });
}

function generateTime2Clock(count: number, rng: () => number): Time2ClockProblem[] {
  const activities = shuffleInPlace([...TIME2_CLOCK_ACTIVITIES], rng);
  const children = shuffleInPlace([...TIME2_CHILDREN], rng);
  return Array.from({ length: count }, (_, i) => {
    const activity = activities[i % activities.length];
    // 시작 시각은 정각 또는 5분 단위, 걸린 시간은 1시간 5분 ~ 4시간 55분(딱 떨어지는 시간 제외)
    let answer = 0;
    let start = 0;
    for (let tries = 0; tries < 100; tries++) {
      answer = randStep(rng, 65, 295, 5);
      start = randStep(rng, 8 * 60, 14 * 60, 5);
      if (answer % 60 !== 0 && !crossesNoon(start, start + answer)) break;
    }
    const name = children[i % children.length];
    return {
      kind: "time2_clock",
      text:
        `${callName(name)}네 가족이 ${activity.noun}${objectParticle(activity.noun)} 시작한 시각과 끝난 시각입니다. ` +
        `${activity.doing} 데 걸린 시간은 몇 시간 몇 분일까요?`,
      start,
      end: start + answer,
      answer,
    };
  });
}

function generateTime2End(count: number, rng: () => number): Time2EndProblem[] {
  const activities = shuffleInPlace([...TIME2_END_ACTIVITIES], rng);
  const children = shuffleInPlace([...TIME2_CHILDREN], rng);
  return Array.from({ length: count }, (_, i) => {
    const activity = activities[i % activities.length];
    // 끝난 시각이 시작한 시각과 다른 '시'가 되도록(정시를 넘어가도록) 고른다.
    let start = 0;
    let duration = 0;
    for (let tries = 0; tries < 100; tries++) {
      start = randStep(rng, activity.start[0], activity.start[1], 5);
      duration = randStep(rng, activity.duration[0], activity.duration[1], 5);
      if (Math.floor((start + duration) / 60) !== Math.floor(start / 60) && (start + duration) % 60 !== 0) break;
    }
    const name = callName(children[i % children.length]);
    return {
      kind: "time2_end",
      text:
        `${name}는 ${formatClockKorean(start)}에 ${activity.begin} ${formatHoursMinutes(duration)} 동안 ${activity.during}. ` +
        `${name}가 ${activity.finish} 시각은 몇 시 몇 분일까요?`,
      start,
      duration,
      answer: start + duration,
    };
  });
}

/** 형식 순서(단위 바꾸기 → 시간표 → 시계 → 끝난 시각)대로 이어 붙인다. */
export function generateTime2Sheet(params: Time2Params, queryString: string, sheetIndex = 0): Time2Problem[] {
  const rng = mulberry32(buildSeed("time2", queryString, sheetIndex));
  const counts = splitTime2Counts(params.count, params.formats);
  return [
    ...generateTime2Convert(counts.convert, rng),
    ...generateTime2Schedule(counts.schedule, rng),
    ...generateTime2Clock(counts.clock, rng),
    ...generateTime2End(counts.end, rng),
  ];
}

export function generateTime2AllSheets(params: Time2Params, queryString: string): Time2Problem[][] {
  return Array.from({ length: params.sheets }, (_, i) => generateTime2Sheet(params, queryString, i));
}
