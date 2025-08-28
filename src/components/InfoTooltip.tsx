"use client";

import { FC, useId, useRef, useState, useEffect } from "react";
import { Info } from "lucide-react";
import { METRIC_INFO, type MetricInfo } from "@/lib/metric-info";

interface Props {
  metric?: keyof typeof METRIC_INFO;
  content?: string;
}

export const InfoTooltip: FC<Props> = ({ metric, content }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const info: MetricInfo | undefined = metric
    ? METRIC_INFO[metric]
    : undefined;
  const body = content ?? info?.ausfuehrlich ?? info?.kurz ?? "";

  const show = () => {
    timeout.current = setTimeout(() => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setPosition(spaceBelow < 80 && spaceAbove > spaceBelow ? "top" : "bottom");
      }
      setVisible(true);
    }, 150);
  };

  const hide = () => {
    if (timeout.current) clearTimeout(timeout.current);
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!body) return null;

  return (
    <span className="relative inline-flex">
      <button
        ref={buttonRef}
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
        className={`absolute z-10 ${
          position === "top"
            ? "bottom-full mb-1 left-1/2 -translate-x-1/2"
            : "top-full mt-1 left-1/2 -translate-x-1/2"
        } p-3 min-w-[220px] max-w-[320px] text-xs text-black bg-white border border-slate-200 rounded shadow-md transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
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
