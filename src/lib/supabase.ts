import { createClient } from "@supabase/supabase-js";
import type { MatchProblem, CalcProblem, Calc3Problem } from "@/lib/math-generator";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getMissingEnvMessage() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return "Supabase 환경 변수가 설정되지 않았습니다 (.env.local).";
  }
  return null;
}

function getClient() {
  const missing = getMissingEnvMessage();
  if (missing) {
    return null;
  }
  return createClient(supabaseUrl!, supabaseAnonKey!);
}

export type WorksheetType =
  | "add"
  | "sub"
  | "add_sub"
  | "mul"
  | "div"
  | "mul_div";

export type WorksheetProblems = MatchProblem[][] | CalcProblem[][] | Calc3Problem[][];

export interface WorksheetRow {
  id: string;
  short_code: string;
  title: string;
  type: WorksheetType;
  operands: number[];
  range_min: number;
  range_max: number;
  problem_count: number;
  problems: WorksheetProblems;
  created_at: string;
}

function generateShortCode(len = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export interface SaveWorksheetResult {
  title: string;
  type: WorksheetType;
  operands: number[];
  rangeMin: number;
  rangeMax: number;
  problemCount: number;
  problems: WorksheetProblems;
}

export async function saveWorksheet(data: SaveWorksheetResult): Promise<{ shortCode: string } | { error: string }> {
  const missing = getMissingEnvMessage();
  if (missing) return { error: missing };

  const client = getClient();
  if (!client) return { error: "Supabase 클라이언트를 초기화할 수 없습니다." };

  try {
    const shortCode = generateShortCode();
    const { error } = await client.from("mathlab_worksheets").insert({
      short_code: shortCode,
      title: data.title,
      type: data.type,
      operands: data.operands,
      range_min: data.rangeMin,
      range_max: data.rangeMax,
      problem_count: data.problemCount,
      problems: data.problems,
    });

    if (error) return { error: error.message };
    return { shortCode };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "알 수 없는 저장 오류" };
  }
}

export async function getWorksheet(shortCode: string): Promise<WorksheetRow | null> {
  const missing = getMissingEnvMessage();
  if (missing) return null;

  const client = getClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("mathlab_worksheets")
      .select("*")
      .eq("short_code", shortCode)
      .single();

    if (error || !data) return null;
    return data as WorksheetRow;
  } catch {
    return null;
  }
}
