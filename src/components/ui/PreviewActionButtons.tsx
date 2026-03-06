import { Check, Copy, Printer, Share2 } from "lucide-react";

interface PreviewActionButtonsProps {
  shareUrl: string | null;
  saving: boolean;
  copied: boolean;
  onPrint: () => void;
  onShare: () => void;
  onCopy: () => void;
}

export default function PreviewActionButtons({
  shareUrl,
  saving,
  copied,
  onPrint,
  onShare,
  onCopy,
}: PreviewActionButtonsProps) {
  return (
    <div className="print:hidden max-w-[860px] mx-auto px-6 flex flex-wrap justify-center items-center gap-3 pb-4">
      <button
        type="button"
        onClick={onPrint}
        className="px-5 py-3 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 cursor-pointer shadow-sm hover:shadow-lg transition-all duration-200"
      >
        <Printer className="w-4 h-4 inline mr-1" strokeWidth={1.5} />인쇄
      </button>
      {!shareUrl ? (
        <button
          type="button"
          onClick={onShare}
          disabled={saving}
          className="px-5 py-3 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 cursor-pointer shadow-sm hover:shadow-lg transition-all duration-200 disabled:opacity-50"
        >
          {saving ? "저장 중..." : <><Share2 className="w-4 h-4 inline mr-1" strokeWidth={1.5} />공유 링크 생성</>}
        </button>
      ) : (
        <button
          type="button"
          onClick={onCopy}
          className="px-5 py-3 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
        >
          {copied ? <><Check className="w-4 h-4 inline mr-1" strokeWidth={1.5} />복사됨</> : <><Copy className="w-4 h-4 inline mr-1" strokeWidth={1.5} />링크 복사</>}
        </button>
      )}
    </div>
  );
}
