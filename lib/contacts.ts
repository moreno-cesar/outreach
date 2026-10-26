import { CATEGORY_ORDER } from "./categories";
import { daysSince, isCold, isFollowUpSoon, isStale } from "./dates";
import type { Contact } from "./types";

export type QuickFilter = "attention" | "cold" | "followup";
export type SortKey = "name" | "recent";

const KNOWN = new Set<string>(CATEGORY_ORDER);

export function fullName(contact: { firstName?: string; lastName?: string }): string {
  const name = `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.replace(/\s+/g, " ").trim();
  return name || "Unnamed";
}

export function initials(contact: { firstName?: string; lastName?: string }): string {
  const first = (contact.firstName ?? "").trim().charAt(0);
  const last = (contact.lastName ?? "").trim().charAt(0);
  const letters = `${first}${last}`.toUpperCase();
  return letters || "?";
}

export function peopleCountLabel(count: number): string {
  return count === 1 ? "1 person" : `${count} people`;
}

export function listTitle(category: string, quickFilter: QuickFilter | null): string {
  if (quickFilter === "attention") return "Need attention";
  if (quickFilter === "cold") return "Gone cold";
  if (quickFilter === "followup") return "Follow up this week";
  if (category === "All") return "All people";
  return category;
}

export function computeStats(contacts: readonly Contact[], today: Date = new Date()) {
  let attention = 0;
  let cold = 0;
  let followup = 0;
  for (const contact of contacts) {
    if (isStale(contact, today)) attention += 1;
    if (isCold(contact, today)) cold += 1;
    if (isFollowUpSoon(contact, today)) followup += 1;
  }
  return { attention, cold, followup };
}

export function orderedCategories(contacts: readonly Contact[]): string[] {
  const seen = new Set<string>();
  for (const contact of contacts) {
    if (contact.category) seen.add(contact.category);
  }
  const known = CATEGORY_ORDER.filter((name) => seen.has(name));
  const rest = [...seen].filter((name) => !KNOWN.has(name)).sort((a, b) => a.localeCompare(b));
  return [...known, ...rest];
}

export function categoryCount(contacts: readonly Contact[], category: string): number {
  if (category === "All") return contacts.length;
  return contacts.filter((contact) => (contact.category || "Uncategorized") === category).length;
}

export function filterContacts(options: {
  contacts: readonly Contact[];
  category: string;
  quickFilter: QuickFilter | null;
  search: string;
  sort: SortKey;
  today?: Date;
}): Contact[] {
  const today = options.today ?? new Date();
  const query = options.search.trim().toLowerCase();
  const list = options.contacts.filter((contact) => {
    if (options.category !== "All" && (contact.category || "Uncategorized") !== options.category) {
      return false;
    }
    if (options.quickFilter === "attention" && !isStale(contact, today)) return false;
    if (options.quickFilter === "cold" && !isCold(contact, today)) return false;
    if (options.quickFilter === "followup" && !isFollowUpSoon(contact, today)) return false;
    if (!query) return true;
    const haystack = [fullName(contact), contact.company, contact.email, contact.phone]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  list.sort((a, b) => {
    if (options.sort === "name") {
      return fullName(a).localeCompare(fullName(b), undefined, { sensitivity: "base" });
    }
    const daysA = daysSince(a.lastContacted, today);
    const daysB = daysSince(b.lastContacted, today);
    if (daysA === null && daysB === null) return fullName(a).localeCompare(fullName(b));
    if (daysA === null) return 1;
    if (daysB === null) return -1;
    if (daysA !== daysB) return daysA - daysB;
    return fullName(a).localeCompare(fullName(b));
  });

  return list;
}
