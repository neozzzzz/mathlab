import Link from "next/link";
import { Link2, PenLine } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-3">수학 문제 생성기</h1>
        <p className="text-gray-500 text-lg">초등 수학 연습 문제를 자동으로 만들어 보세요</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[600px] w-full">
        {/* 짝 맞추기 */}
        <Link
          href="/match"
          className="group bg-white border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-orange-400 hover:shadow-lg transition-all"
        >
          <Link2 className="w-10 h-10 mx-auto mb-4 text-gray-400 group-hover:text-orange-500 transition-colors" strokeWidth={1.5} />
          <h2 className="text-xl font-black mb-2 group-hover:text-orange-600">짝 맞추기</h2>
          <p className="text-sm text-gray-500">
            윗줄 숫자와 아랫줄 결과를<br />선으로 이어 보세요
          </p>
          <div className="mt-4 inline-block px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
            더하기 · 빼기
          </div>
        </Link>

        {/* 일반 연산 */}
        <Link
          href="/calc"
          className="group bg-white border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:shadow-lg transition-all"
        >
          <PenLine className="w-10 h-10 mx-auto mb-4 text-gray-400 group-hover:text-blue-500 transition-colors" strokeWidth={1.5} />
          <h2 className="text-xl font-black mb-2 group-hover:text-blue-600">일반 연산</h2>
          <p className="text-sm text-gray-500">
            빈칸에 답을 직접<br />써 넣는 연습 문제
          </p>
          <div className="mt-4 inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
            더하기 · 빼기 · 곱하기 · 나누기
          </div>
        </Link>
      </div>

      <p className="mt-12 text-xs text-gray-300">무료 · 로그인 불필요 · 인쇄 최적화</p>
    </div>
  );
}
