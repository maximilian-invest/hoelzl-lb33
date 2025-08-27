"use client";

import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreResult, ContextMetrics, DecisionBadge } from "@/types/score";
import { Summary } from "./Summary";
import { Grid } from "./Grid";
import { Legend } from "./Legend";
import { ContextFacts } from "./ContextFacts";

interface Props {
  score: ScoreResult;
  metrics: ContextMetrics;
  decision?: DecisionBadge;
}

export const InvestmentScoreSection: FC<Props> = ({ score, metrics }) => (
  <Card className="mt-6">
    <CardHeader>
      <CardTitle>Investitionsscore</CardTitle>
    </CardHeader>
    <CardContent>
      <Summary total={score.total} grade={score.grade} />
      <Grid score={score} />
      {score.bullets.length > 0 && (
        <ul className="mt-4 list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
          {score.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      <Legend />
      <ContextFacts metrics={metrics} />
    </CardContent>
  </Card>
);
