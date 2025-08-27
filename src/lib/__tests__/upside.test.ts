import { calculateUpside, irr } from "../upside";
import type { UpsideScenario } from "../upside";

test("irrDelta is computed", () => {
  const base = [-100, 30, 30, 30, 30];
  const irrBasis = irr(base);
  const scenario: UpsideScenario = {
    id: "u1",
    active: true,
    type: "Umwidmung_Hotel",
    title: "Test",
    startYear: 1,
    addedSqm: 1,
    newRentPerSqm: 0.0833333333,
    occupancyPct: 100,
    capex: 0,
    probabilityPct: 100,
  };
  const res = calculateUpside(base, irrBasis, [scenario]);
  expect(res.irrDelta).toBeCloseTo(0.014825, 5);
});

test("pWeighted uses probability", () => {
  const base = [-100, 30, 30, 30, 30];
  const irrBasis = irr(base);
  const scenario: UpsideScenario = {
    id: "u1",
    active: true,
    type: "Umwidmung_Hotel",
    title: "Test",
    startYear: 1,
    addedSqm: 1,
    newRentPerSqm: 0.0833333333,
    occupancyPct: 100,
    capex: 0,
    probabilityPct: 50,
  };
  const res = calculateUpside(base, irrBasis, [scenario]);
  expect(res.pWeighted).toBeCloseTo(0.0074125, 5);
});

test("mapping to bonus points", () => {
  const base = [-100, 30, 30, 30, 30];
  const irrBasis = irr(base);
  const scenario: UpsideScenario = {
    id: "u1",
    active: true,
    type: "Umwidmung_Hotel",
    title: "Test",
    startYear: 1,
    addedSqm: 1,
    newRentPerSqm: 0.25,
    occupancyPct: 100,
    capex: 0,
    probabilityPct: 100,
  };
  const res = calculateUpside(base, irrBasis, [scenario]);
  expect(res.bonus).toBe(10);
});
