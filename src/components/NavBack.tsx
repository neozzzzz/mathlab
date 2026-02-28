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
        className="group inline-flex items-center w-fit text-sm text-slate-500 hover:text-slate-700 font-semibold"
      >
        <span className="inline-block transition-all duration-150 group-hover:translate-x-[-2px]">←</span>
        <span className="ml-1 transition-all duration-150 group-hover:font-bold">{label}</span>
      </Link>
    </div>
  );
}
