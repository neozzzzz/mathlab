"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { trackEvent, type GAEventName } from "@/lib/ga";

interface NavBackProps {
  href: string;
  label: string;
  gaEvent?: GAEventName;
  gaFrom?: string;
}

export default function NavBack({ href, label, gaEvent, gaFrom }: NavBackProps) {
  return (
    <div className="print:hidden max-w-[820px] mx-auto px-6 pt-6">
      <Link
        href={href}
        onClick={() => {
          if (gaEvent && gaFrom) {
            trackEvent(gaEvent, { from: gaFrom });
          }
        }}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-700 hover:text-slate-900 hover:border-slate-400 shadow-sm transition-colors"
      >
        <span className="inline-flex items-center justify-center rounded-full w-6 h-6 bg-slate-900 text-white">
          <ArrowLeft className="w-3.5 h-3.5" />
        </span>
        <span className="font-bold">{label}</span>
      </Link>
    </div>
  );
}
