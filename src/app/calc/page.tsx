import Link from "next/link";
import { PenLine } from "lucide-react";

export default function CalcPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <PenLine className="w-16 h-16 mx-auto mb-6 text-gray-300" strokeWidth={1.5} />
        <h1 className="text-2xl font-black mb-3">일반 연산</h1>
        <p className="text-gray-500 mb-8">곧 출시됩니다!</p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 max-w-sm">
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong>예정 기능:</strong><br />
            • 더하기 / 빼기 / 곱하기 / 나누기<br />
            • 난이도 조절 (1자리 ~ 3자리)<br />
            • 세로셈 / 가로셈 선택<br />
            • 받아올림 / 받아내림 포함 여부
          </p>
        </div>
        <Link
          href="/"
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300"
        >
          ← 돌아가기
        </Link>
      </div>
    </div>
  );
}
