"use client";

import Link from "next/link";
import { trackEvent, type GAEventName } from "@/lib/ga";

interface NavBackProps {
  href: string;
  label: string;
  gaEvent?: GAEventName;
  gaFrom?: string;
}

export default function NavBack({ href, label, gaEvent, gaFrom }: NavBackProps) {
  return (
    <div className="print:hidden max-w-[800px] mx-auto px-6 pt-6 mb-4">
      <Link
        href={href}
        onClick={() => {
          if (gaEvent && gaFrom) {
            trackEvent(gaEvent, { from: gaFrom });
          }
        }}
        className="group inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/85 backdrop-blur px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:border-slate-400 shadow-sm transition-all duration-200"
      >
        <span className="inline-block transition-transform duration-150 group-hover:-translate-x-0.5">←</span>
        <span className="transition-all duration-150 group-hover:font-bold">{label}</span>
      </Link>
    </div>
  );
}
