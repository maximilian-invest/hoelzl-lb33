import React from "react";

type DistrictInfo = { ort: string; preis: number };

type MapProps = {
  districts: readonly DistrictInfo[];
  selected: string;
  onSelect: (ort: string) => void;
};

const SalzburgMap: React.FC<MapProps> = ({ districts, selected, onSelect }) => {
  const cols = 6;
  const cellW = 160;
  const cellH = 100;
  const width = cols * cellW;
  const rows = Math.ceil(districts.length / cols);
  const height = rows * cellH;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {districts.map((d, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * cellW + cellW / 2;
        const y = row * cellH + cellH / 2;
        const isSel = d.ort === selected;
        return (
          <g
            key={d.ort}
            onClick={() => onSelect(d.ort)}
            className="cursor-pointer"
          >
            <circle
              cx={x}
              cy={y}
              r={32}
              fill={isSel ? "#6366F1" : "#e2e8f0"}
              stroke="#94a3b8"
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs pointer-events-none"
            >
              {d.ort}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default SalzburgMap;
