"use client";

import { FC, useId, useRef, useState, useEffect } from "react";
import { Info } from "lucide-react";
import { METRIC_INFO, type MetricInfo } from "@/lib/metric-info";

interface Props {
  metric?: keyof typeof METRIC_INFO;
  content?: string;
  asButton?: boolean; // Neu: Steuert ob als Button oder Span gerendert wird
}

export const InfoTooltip: FC<Props> = ({ metric, content, asButton = true }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<"right" | "left">("right");
  const [isClient, setIsClient] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const id = useId();
  const info: MetricInfo | undefined = metric
    ? METRIC_INFO[metric]
    : undefined;
  const body = content ?? info?.ausfuehrlich ?? info?.kurz ?? "";

  useEffect(() => {
    setIsClient(true);
  }, []);

  const show = () => {
    timeout.current = setTimeout(() => {
      const currentRef = asButton ? buttonRef.current : spanRef.current;
      if (currentRef) {
        const rect = currentRef.getBoundingClientRect();
        const spaceRight = window.innerWidth - rect.right;
        const spaceLeft = rect.left;
        setPosition(spaceRight < 300 && spaceLeft > spaceRight ? "left" : "right");
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

  // Server-side rendering: Zeige nur das Icon ohne Interaktivität
  if (!isClient) {
    return (
      <span className="relative inline-flex">
        <span className="w-4 h-4 text-slate-400">
          <Info className="w-4 h-4" />
        </span>
      </span>
    );
  }

  const commonProps = {
    className: "w-4 h-4 text-slate-400",
    onMouseEnter: show,
    onFocus: show,
    onMouseLeave: hide,
    onBlur: hide,
    "aria-describedby": visible ? id : undefined,
  };

  return (
    <span className="relative inline-flex">
      {asButton ? (
        <button
          {...commonProps}
          ref={buttonRef}
          type="button"
        >
          <Info className="w-4 h-4" />
        </button>
      ) : (
        <span
          {...commonProps}
          ref={spanRef}
          role="button"
          tabIndex={0}
        >
          <Info className="w-4 h-4" />
        </span>
      )}
      <div
        id={id}
        role="tooltip"
        className={`absolute z-50 ${
          position === "right"
            ? "left-full ml-1 top-1/2 -translate-y-1/2"
            : "right-full mr-1 top-1/2 -translate-y-1/2"
        } p-3 min-w-[300px] max-w-[500px] text-xs text-black bg-white border border-slate-200 rounded shadow-md transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"} break-words whitespace-pre-line max-h-[60vh] overflow-auto`}
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
