import { describe, expect, it } from "vitest";
import {
  daysSince,
  formatDateLong,
  isCold,
  isFollowUpSoon,
  isStale,
  relativeLabel,
  toISODate,
} from "./dates";

const today = new Date(2026, 9, 26);

function daysBefore(days: number): string {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("daysSince", () => {
  it("counts whole calendar days, including across daylight saving", () => {
    for (let days = -20; days <= 400; days += 1) {
      expect(daysSince(daysBefore(days), today)).toBe(days);
    }
  });

  it("returns null for missing or impossible dates", () => {
    expect(daysSince("", today)).toBeNull();
    expect(daysSince("   ", today)).toBeNull();
    expect(daysSince(null, today)).toBeNull();
    expect(daysSince(undefined, today)).toBeNull();
    expect(daysSince("nope", today)).toBeNull();
    expect(daysSince("2026-02-31", today)).toBeNull();
    expect(daysSince("2026-1-01", today)).toBeNull();
    expect(daysSince("2026-00-10", today)).toBeNull();
  });

  it("formats a local calendar date without shifting the day", () => {
    expect(toISODate(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});

describe("follow-up and overdue rules", () => {
  it("marks 30 days as needing attention, 60 as cold, and 23–29 as follow-up soon", () => {
    for (let days = 0; days <= 120; days += 1) {
      const person = { lastContacted: daysBefore(days) };
      expect(isStale(person, today)).toBe(days >= 30);
      expect(isCold(person, today)).toBe(days >= 60);
      expect(isFollowUpSoon(person, today)).toBe(days >= 23 && days < 30);
      if (isCold(person, today)) expect(isStale(person, today)).toBe(true);
      if (isFollowUpSoon(person, today)) expect(isStale(person, today)).toBe(false);
    }
  });

  it("does not flag someone who has never been contacted or has a future date", () => {
    expect(isStale({ lastContacted: "" }, today)).toBe(false);
    expect(isCold({ lastContacted: null }, today)).toBe(false);
    expect(isFollowUpSoon({}, today)).toBe(false);
    expect(isStale({ lastContacted: daysBefore(-3) }, today)).toBe(false);
    expect(isFollowUpSoon({ lastContacted: daysBefore(-1) }, today)).toBe(false);
  });

  it("uses the boundaries exactly", () => {
    expect(isFollowUpSoon({ lastContacted: daysBefore(22) }, today)).toBe(false);
    expect(isFollowUpSoon({ lastContacted: daysBefore(23) }, today)).toBe(true);
    expect(isFollowUpSoon({ lastContacted: daysBefore(29) }, today)).toBe(true);
    expect(isStale({ lastContacted: daysBefore(29) }, today)).toBe(false);
    expect(isStale({ lastContacted: daysBefore(30) }, today)).toBe(true);
    expect(isCold({ lastContacted: daysBefore(59) }, today)).toBe(false);
    expect(isCold({ lastContacted: daysBefore(60) }, today)).toBe(true);
  });
});

describe("relativeLabel", () => {
  it("uses plain language", () => {
    expect(relativeLabel("", today)).toBe("Never logged");
    expect(relativeLabel(daysBefore(0), today)).toBe("Today");
    expect(relativeLabel(daysBefore(1), today)).toBe("Yesterday");
    expect(relativeLabel(daysBefore(2), today)).toBe("2 days ago");
    expect(relativeLabel(daysBefore(13), today)).toBe("13 days ago");
    expect(relativeLabel(daysBefore(14), today)).toBe("2 weeks ago");
    expect(relativeLabel(daysBefore(59), today)).toBe("8 weeks ago");
    expect(relativeLabel(daysBefore(60), today)).toBe("2 months ago");
    expect(relativeLabel(daysBefore(-1), today)).toBe("In 1 day");
    expect(relativeLabel(daysBefore(-3), today)).toBe("In 3 days");
  });

  it("formats a saved date for the profile", () => {
    expect(formatDateLong("")).toBe("—");
    expect(formatDateLong("not-a-date")).toBe("—");
    expect(formatDateLong("2026-10-26")).toMatch(/2026/);
  });
});
