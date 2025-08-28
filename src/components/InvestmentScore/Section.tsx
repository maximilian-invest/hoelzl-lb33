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
      <Legend score={score} metrics={metrics} />
      <ContextFacts metrics={metrics} />
    </CardContent>
  </Card>
);
