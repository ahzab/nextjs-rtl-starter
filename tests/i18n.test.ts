import { describe, expect, it } from "vitest";

import { countLabel, getDictionary } from "../lib/i18n";

describe("countLabel", () => {
  const ar = getDictionary("ar").store;
  const en = getDictionary("en").store;

  it("uses Arabic's own forms for one and two", () => {
    expect(countLabel(1, ar.itemOne, ar.itemTwo, ar.items)).toBe("قطعة واحدة");
    expect(countLabel(2, ar.itemOne, ar.itemTwo, ar.items)).toBe("قطعتان");
    expect(countLabel(4, ar.itemOne, ar.itemTwo, ar.items)).toBe("4 قطع");
  });

  it("fills the count in English", () => {
    expect(countLabel(1, en.itemOne, en.itemTwo, en.items)).toBe("1 item");
    expect(countLabel(7, en.itemOne, en.itemTwo, en.items)).toBe("7 items");
  });
});
