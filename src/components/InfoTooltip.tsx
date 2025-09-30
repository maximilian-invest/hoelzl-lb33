"use client";

import { FC, useId, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
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

  const calcAndSetPosition = () => {
    const currentRef = asButton ? buttonRef.current : spanRef.current;
    if (!currentRef) return;
    const rect = currentRef.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;
    const useLeft = spaceRight < 300 && spaceLeft > spaceRight;
    setPosition(useLeft ? "left" : "right");
    const top = rect.top + rect.height / 2;
    const left = useLeft ? rect.left - 8 : rect.right + 8;
    setCoords({ top, left });
  };

  const show = () => {
    timeout.current = setTimeout(() => {
      calcAndSetPosition();
      setVisible(true);
    }, 150);
  };

  const hide = () => {
    if (timeout.current) clearTimeout(timeout.current);
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    // Reposition on resize/scroll
    const update = () => calcAndSetPosition();
    window.addEventListener("resize", update);
    // capture true to catch scroll on ancestors
    window.addEventListener("scroll", update, true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
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
      {isClient && visible && coords
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              onMouseEnter={show}
              onMouseLeave={hide}
              style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
              className={`z-50 ${
                position === "right"
                  ? "translate-y-[-50%]"
                  : "translate-y-[-50%] -translate-x-full"
              } p-3 min-w-[300px] max-w-[500px] text-xs text-black bg-white border border-slate-200 rounded shadow-md transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"} break-words whitespace-pre-line max-h-[60vh] overflow-auto`}
            >
              {info?.title && <div className="font-semibold">{info.title}</div>}
              {info?.kurz && <div className="mt-1">{info.kurz}</div>}
              {info?.ausfuehrlich && <div className="mt-1">{info.ausfuehrlich}</div>}
              {info?.formel && <div className="mt-1 italic">Formel: {info.formel}</div>}
              {info?.bankfaustregeln && <div className="mt-1">{info.bankfaustregeln}</div>}
              {content && !metric && <div className="mt-1">{content}</div>}
            </div>,
            document.body
          )
        : null}
    </span>
  );
};
