import { describe, expect, it } from "vitest";
import {
  categoryCount,
  computeStats,
  filterContacts,
  fullName,
  initials,
  listTitle,
  orderedCategories,
  peopleCountLabel,
} from "./contacts";
import type { Contact } from "./types";

const today = new Date(2026, 9, 26);

function daysBefore(days: number): string {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function person(partial: Partial<Contact> & Pick<Contact, "firstName">): Contact {
  return {
    id: partial.id ?? partial.firstName,
    firstName: partial.firstName,
    lastName: partial.lastName ?? "Sample",
    company: partial.company ?? "",
    email: partial.email ?? "",
    phone: partial.phone ?? "",
    category: partial.category ?? "Client",
    lastContacted: partial.lastContacted ?? daysBefore(1),
    notes: partial.notes ?? "",
    createdAt: partial.createdAt ?? "2026-01-01T00:00:00.000Z",
  };
}

const people = [
  person({ firstName: "Sam", lastName: "Sample", category: "Client", company: "Northwind", lastContacted: daysBefore(45), email: "sam.sample@example.com", phone: "555-0101" }),
  person({ firstName: "Riley", lastName: "Example", category: "Vendor", company: "Example Supply", lastContacted: daysBefore(10) }),
  person({ firstName: "Avery", lastName: "Demo", category: "Manager", lastContacted: daysBefore(25) }),
  person({ firstName: "Quinn", lastName: "Placeholder", category: "Partner", lastContacted: daysBefore(70), company: "Fictional Co" }),
];

describe("names", () => {
  it("builds a display name and initials", () => {
    expect(fullName({ firstName: "Sam", lastName: "Sample" })).toBe("Sam Sample");
    expect(fullName({ firstName: "  ", lastName: "" })).toBe("Unnamed");
    expect(initials({ firstName: "sam", lastName: "sample" })).toBe("SS");
    expect(initials({ firstName: "", lastName: "" })).toBe("?");
    expect(peopleCountLabel(1)).toBe("1 person");
    expect(peopleCountLabel(0)).toBe("0 people");
  });
});

describe("computeStats", () => {
  it("counts attention, cold, and follow-up from the same dates", () => {
    expect(computeStats(people, today)).toEqual({ attention: 2, cold: 1, followup: 1 });
  });
});

describe("categories", () => {
  it("keeps Manager, Client, Vendor first and sorts the rest", () => {
    expect(orderedCategories(people)).toEqual(["Manager", "Client", "Vendor", "Partner"]);
    expect(categoryCount(people, "All")).toBe(4);
    expect(categoryCount(people, "Client")).toBe(1);
  });
});

describe("filterContacts", () => {
  it("filters by category, search, and quick filter", () => {
    const byCategory = filterContacts({
      contacts: people,
      category: "Vendor",
      quickFilter: null,
      search: "",
      sort: "name",
      today,
    });
    expect(byCategory.map((contact) => contact.firstName)).toEqual(["Riley"]);

    const bySearch = filterContacts({
      contacts: people,
      category: "All",
      quickFilter: null,
      search: "NORTH",
      sort: "name",
      today,
    });
    expect(bySearch.map((contact) => contact.firstName)).toEqual(["Sam"]);

    const byPhone = filterContacts({
      contacts: people,
      category: "All",
      quickFilter: null,
      search: "555-0101",
      sort: "name",
      today,
    });
    expect(byPhone.map((contact) => contact.firstName)).toEqual(["Sam"]);

    const followup = filterContacts({
      contacts: people,
      category: "All",
      quickFilter: "followup",
      search: "",
      sort: "name",
      today,
    });
    expect(followup.map((contact) => contact.firstName)).toEqual(["Avery"]);
  });

  it("sorts by name or by most recent conversation", () => {
    const byName = filterContacts({
      contacts: people,
      category: "All",
      quickFilter: null,
      search: "",
      sort: "name",
      today,
    }).map((contact) => contact.firstName);
    expect(byName).toEqual(["Avery", "Quinn", "Riley", "Sam"]);

    const never = person({ firstName: "Casey", lastName: "Blank", lastContacted: "" });
    const byRecent = filterContacts({
      contacts: [...people, never],
      category: "All",
      quickFilter: null,
      search: "",
      sort: "recent",
      today,
    }).map((contact) => contact.firstName);
    expect(byRecent).toEqual(["Riley", "Avery", "Sam", "Quinn", "Casey"]);
  });

  it("names the list after the active filter", () => {
    expect(listTitle("All", null)).toBe("All people");
    expect(listTitle("Client", null)).toBe("Client");
    expect(listTitle("All", "cold")).toBe("Gone cold");
  });
});
