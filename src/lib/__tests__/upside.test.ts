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
    mode: "add_area",
    addedSqm: 1,
    newRentPerSqm: 0.0833333333,
    existingSqm: 0,
    rentIncreasePerSqm: 0,
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
    mode: "add_area",
    addedSqm: 1,
    newRentPerSqm: 0.0833333333,
    existingSqm: 0,
    rentIncreasePerSqm: 0,
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
    mode: "add_area",
    addedSqm: 1,
    newRentPerSqm: 1,
    existingSqm: 0,
    rentIncreasePerSqm: 0,
    occupancyPct: 100,
    capex: 0,
    probabilityPct: 100,
  };
  const res = calculateUpside(base, irrBasis, [scenario]);
  expect(res.bonus).toBe(10);
});

test("rent increase mode mirrors area mode", () => {
  const base = [-100, 30, 30, 30, 30];
  const irrBasis = irr(base);
  const scenario: UpsideScenario = {
    id: "u1",
    active: true,
    type: "Umwidmung_Hotel",
    title: "Test",
    startYear: 1,
    mode: "rent_increase",
    addedSqm: 0,
    newRentPerSqm: 0,
    existingSqm: 1,
    rentIncreasePerSqm: 1,
    occupancyPct: 100,
    capex: 0,
    probabilityPct: 100,
  };
  const res = calculateUpside(base, irrBasis, [scenario]);
  expect(res.irrDelta).toBeCloseTo(0.168289, 5);
});

test("handles missing IRR gracefully", () => {
  const base = Array(5).fill(0);
  const irrBasis = irr(base);
  expect(irrBasis).toBe(0);
  const res = calculateUpside(base, irrBasis, []);
  expect(res.bonus).toBe(0);
  expect(res.irrUpside).toBe(0);
});
