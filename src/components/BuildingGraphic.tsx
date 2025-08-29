'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

export type Unit = {
  top: string;
  areaM2: number;
};

export type BuildingGraphicProps = {
  units: Unit[];
};

const floorHeight = 70;
const houseWidth = 300;
const paddingX = 24;
const paddingY = 24;
const roofHeight = 24;
const gutter = 10;

export default function BuildingGraphic({ units }: BuildingGraphicProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const totalH = paddingY * 2 + roofHeight + (units?.length ?? 0) * floorHeight;
  const maxM2 = Math.max(1, ...(units ?? []).map((u) => u.areaM2 || 0));

  const handleExport = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'building.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${paddingX * 2 + houseWidth} ${totalH}`}
        role="img"
        aria-label={`Haus mit ${units?.length ?? 0} Stockwerken`}
      >
        <rect
          x={paddingX}
          y={paddingY + roofHeight}
          width={houseWidth}
          height={floorHeight * (units?.length ?? 0)}
          rx={12}
          className="outer"
        />
        <polygon
          points={`${paddingX},${paddingY + roofHeight} ${paddingX + houseWidth},${paddingY + roofHeight} ${paddingX + houseWidth / 2},${paddingY}`}
          className="roof"
        />
        {(units ?? []).map((u, i, arr) => {
          const y = paddingY + roofHeight + (arr.length - 1 - i) * floorHeight + gutter;
          const innerW = houseWidth - gutter * 2;
          const barW = innerW * Math.min(1, (u.areaM2 || 0) / maxM2);
          return (
            <g
              key={`${u.top}-${i}`}
              transform={`translate(${paddingX + gutter},${y})`}
              style={{
                opacity: 0,
                animation: `fadeInUp 350ms ease ${(i + 1) * 60}ms forwards`,
              }}
            >
              <rect
                className="floor"
                x={0}
                y={0}
                width={innerW}
                height={floorHeight - gutter * 2}
                rx={8}
              />
              <text className="label" x={14} y={22}>
                {u.top}
              </text>
              <text className="label" x={14} y={42}>
                {Intl.NumberFormat('de-AT').format(u.areaM2)} m²
              </text>
              <rect
                className="bar"
                x={10}
                y={floorHeight - gutter * 2 - 12}
                width={barW}
                height={6}
                rx={3}
              />
            </g>
          );
        })}
        <style>{`
          .outer, .roof, .floor { stroke-width:2; }
          .outer { fill: transparent; }
          text { font-family: sans-serif; font-size:14px; }
          @media (prefers-color-scheme: light) {
            .roof { fill:#e2e8f0; stroke:#334155; }
            .floor { fill:#f8fafc; stroke:#334155; }
            .bar { fill:#3b82f6; }
            text { fill:#1e293b; }
          }
          @media (prefers-color-scheme: dark) {
            .roof { fill:#334155; stroke:#cbd5e1; }
            .floor { fill:#1e293b; stroke:#cbd5e1; }
            .bar { fill:#60a5fa; }
            text { fill:#f8fafc; }
          }
          @keyframes fadeInUp {
            0% { opacity:0; transform:translateY(8px); }
            100% { opacity:1; transform:translateY(0); }
          }
        `}</style>
      </svg>
      <Button variant="outline" size="sm" className="mt-2" onClick={handleExport}>
        SVG exportieren
      </Button>
    </div>
  );
}

