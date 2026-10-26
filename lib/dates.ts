/** Days since the last conversation before someone needs attention. */
export const STALE_DAYS = 30;

/** Days since the last conversation before a relationship has gone cold. */
export const COLD_DAYS = 60;

/**
 * How many days before the attention threshold we start a follow-up reminder.
 * With the defaults, that is days 23 through 29.
 */
export const FOLLOWUP_WINDOW_DAYS = 7;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = ISO_DATE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Calendar date in the local timezone, as YYYY-MM-DD. */
export function toISODate(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Whole calendar days from `dateStr` until `today`.
 * Positive means the date is in the past. Null when the date is missing or invalid.
 * Rounding keeps the count stable across daylight-saving transitions.
 */
export function daysSince(
  dateStr: string | null | undefined,
  today: Date = new Date(),
): number | null {
  const parsed = parseISODate(dateStr);
  if (!parsed) return null;
  const diff = startOfLocalDay(today).getTime() - parsed.getTime();
  return Math.round(diff / MS_PER_DAY);
}

type WithLastContact = { lastContacted?: string | null };

export function isStale(contact: WithLastContact, today: Date = new Date()): boolean {
  const days = daysSince(contact.lastContacted, today);
  return days !== null && days >= STALE_DAYS;
}

export function isCold(contact: WithLastContact, today: Date = new Date()): boolean {
  const days = daysSince(contact.lastContacted, today);
  return days !== null && days >= COLD_DAYS;
}

export function isFollowUpSoon(contact: WithLastContact, today: Date = new Date()): boolean {
  const days = daysSince(contact.lastContacted, today);
  return (
    days !== null &&
    days >= STALE_DAYS - FOLLOWUP_WINDOW_DAYS &&
    days < STALE_DAYS
  );
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function relativeLabel(
  dateStr: string | null | undefined,
  today: Date = new Date(),
): string {
  const days = daysSince(dateStr, today);
  if (days === null) return "Never logged";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 0) return `In ${plural(Math.abs(days), "day")}`;
  if (days < 14) return `${plural(days, "day")} ago`;
  if (days < 60) return `${plural(Math.round(days / 7), "week")} ago`;
  return `${plural(Math.round(days / 30), "month")} ago`;
}

export function formatDateLong(dateStr: string | null | undefined): string {
  const date = parseISODate(dateStr);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
