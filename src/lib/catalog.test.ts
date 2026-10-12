import { describe, expect, it } from "vitest";
import { calculateTotal, priceSelection, validateProductSelection, type CatalogProduct } from "./catalog";

const active: CatalogProduct[] = [
  { id: "geo", label: "Geo Tools", amount: 650 },
  { id: "compass", label: "Compass only", amount: 300 },
  { id: "tape", label: "50m Tape", amount: 250 },
];

describe("validateProductSelection", () => {
  it("rejects an empty selection", () => expect(validateProductSelection([])).toBeNull());
  it("rejects non-arrays and non-string ids", () => { expect(validateProductSelection("geo")).toBeNull(); expect(validateProductSelection([1])).toBeNull(); expect(validateProductSelection([""])).toBeNull(); });
  it("rejects duplicate selections", () => expect(validateProductSelection(["geo", "geo"])).toBeNull());
  it("accepts unique ids", () => expect(validateProductSelection(["geo", "tape"])).toEqual(["geo", "tape"]));
});

describe("priceSelection", () => {
  it("prices items from the active catalogue", () => expect(priceSelection(["geo", "tape"], active)).toEqual([{ id: "geo", label: "Geo Tools", amount: 650 }, { id: "tape", label: "50m Tape", amount: 250 }]));
  it("rejects unknown, hidden or deleted items", () => expect(priceSelection(["geo", "NOT_AN_ITEM"], active)).toBeNull());
});

describe("calculateTotal", () => {
  it("adds up the line items", () => expect(calculateTotal(active)).toBe(1200));
  it("does not drift on decimal prices", () => expect(calculateTotal([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3));
});
