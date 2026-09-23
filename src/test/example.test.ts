import { describe, it, expect } from "vitest";
import { buildApiUrl } from "@/lib/api";

describe("api url helper", () => {
  it("should append the api base once and avoid duplicate /api segments", () => {
    expect(buildApiUrl("/items")).toBe("http://localhost:5000/api/items");
    expect(buildApiUrl("/api/rentals")).toBe("http://localhost:5000/api/rentals");
  });
});
