"use client";

import React from "react";
import { ExitScenarios } from "@/components/ExitScenarios";

interface ExitScenariosTabProps {
  initialInputs: {
    kaufpreis: number;
    nebenkosten: number;
    darlehenStart: number;
    eigenkapital: number;
    wachstumsrate: number;
  };
}

export function ExitScenariosTab({ initialInputs }: ExitScenariosTabProps) {
  return (
    <div className="pt-20 pb-6">
      <div className="max-w-6xl mx-auto px-6">
        <ExitScenarios initialInputs={initialInputs} />
      </div>
    </div>
  );
}
