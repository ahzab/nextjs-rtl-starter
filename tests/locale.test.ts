import { describe, expect, it } from "vitest";

import { pickLocale } from "../lib/locale";

describe("pickLocale", () => {
  it("defaults to Arabic with no header", () => {
    expect(pickLocale(null)).toBe("ar");
    expect(pickLocale("")).toBe("ar");
  });

  it("follows the first supported language", () => {
    expect(pickLocale("ar-SA,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(pickLocale("en-US,en;q=0.9")).toBe("en");
  });

  it("honours q-values over order", () => {
    expect(pickLocale("ar;q=0.5,en;q=0.9")).toBe("en");
  });

  it("skips unsupported languages", () => {
    expect(pickLocale("fr-FR,fr;q=0.9,en;q=0.5")).toBe("en");
    expect(pickLocale("fr,de")).toBe("ar");
  });

  it("ignores q=0", () => {
    expect(pickLocale("en;q=0,ar;q=0.1")).toBe("ar");
  });
});
