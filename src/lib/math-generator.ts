export type MatchType = "add" | "sub";
export type CalcType = "add" | "sub" | "add_sub" | "mul" | "div" | "mul_div";

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
  layout: "a" | "b";
}

export interface CalcProblem {
  a: number;
  b: number;
  type: CalcType;
  answer: number;
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

  const validTypes = new Set(["add", "sub", "add_sub", "mul", "div", "mul_div"]);
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

  return {
    type: t as CalcType,
    count,
    sheets,
    rangeMin,
    rangeMax,
    opMin,
    opMax,
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
