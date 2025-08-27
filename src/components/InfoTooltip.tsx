"use client";

import { FC, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { METRIC_INFO, type MetricInfo } from "@/lib/metric-info";

interface Props {
  metric?: keyof typeof METRIC_INFO;
  content?: string;
}

export const InfoTooltip: FC<Props> = ({ metric, content }) => {
  const [visible, setVisible] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const id = useId();
  const info: MetricInfo | undefined = metric
    ? METRIC_INFO[metric]
    : undefined;
  const body = content ?? info?.ausfuehrlich ?? info?.kurz ?? "";

  if (!body) return null;

  const show = () => {
    timeout.current = setTimeout(() => setVisible(true), 150);
  };

  const hide = () => {
    if (timeout.current) clearTimeout(timeout.current);
    setVisible(false);
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="w-4 h-4 text-slate-400"
        onMouseEnter={show}
        onFocus={show}
        onMouseLeave={hide}
        onBlur={hide}
        aria-describedby={visible ? id : undefined}
      >
        <Info className="w-4 h-4" />
      </button>
      <div
        id={id}
        role="tooltip"
        className={`absolute z-10 top-full left-1/2 -translate-x-1/2 mt-1 p-2 text-xs text-white bg-slate-700 rounded shadow-md transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {info?.title && <div className="font-semibold">{info.title}</div>}
        {info?.kurz && <div className="mt-1">{info.kurz}</div>}
        {info?.ausfuehrlich && <div className="mt-1">{info.ausfuehrlich}</div>}
        {info?.formel && <div className="mt-1 italic">Formel: {info.formel}</div>}
        {info?.bankfaustregeln && <div className="mt-1">{info.bankfaustregeln}</div>}
        {content && !metric && <div className="mt-1">{content}</div>}
      </div>
    </span>
  );
};
