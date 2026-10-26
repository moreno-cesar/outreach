import { describe, expect, it } from "vitest";
import type { ContactInput } from "../types";
import {
  createContactStore,
  createLocalStorageStore,
  createMemoryStore,
  storageKey,
} from "./store";

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const sample: ContactInput = {
  firstName: "  Sam ",
  lastName: " Sample ",
  company: "Example Co",
  email: "sam.sample@example.com",
  phone: "555-0100",
  category: "",
  lastContacted: "2026-10-01",
  notes: "Met at a fictional shop.",
};

describe("contact store", () => {
  it("starts empty", () => {
    const storage = new MemoryStorage();
    const store = createLocalStorageStore({ storage });
    expect(store.list()).toEqual([]);
    expect(store.status).toBe("device");
    expect(createMemoryStore().list()).toEqual([]);
    expect(createMemoryStore().status).toBe("tab");
  });

  it("adds, updates, removes, and keeps the list after a new store is opened", async () => {
    const storage = new MemoryStorage();
    const store = createLocalStorageStore({ storage, namespace: "demo" });
    const created = await store.add(sample);
    expect(created.firstName).toBe("Sam");
    expect(created.lastName).toBe("Sample");
    expect(created.category).toBe("Uncategorized");
    expect(created.id).toBeTruthy();

    const seen: number[] = [];
    const unsubscribe = store.subscribe((contacts) => seen.push(contacts.length));
    expect(seen).toEqual([]);

    const updated = await store.update(created.id, { company: "Example Supply", notes: "Called." });
    expect(updated?.company).toBe("Example Supply");
    expect(updated?.notes).toBe("Called.");
    expect(await store.update("missing", { company: "Nope" })).toBeNull();

    const reopened = createLocalStorageStore({ storage, namespace: "demo" });
    expect(reopened.list()).toHaveLength(1);
    expect(reopened.list()[0]?.notes).toBe("Called.");

    expect(await store.remove(created.id)).toBe(true);
    expect(store.list()).toEqual([]);
    expect(await store.remove(created.id)).toBe(false);
    unsubscribe();
    await store.add({ ...sample, firstName: "Riley" });
    expect(seen).toEqual([1, 0]);
  });

  it("keeps two namespaces from reading or writing each other", async () => {
    const storage = new MemoryStorage();
    const west = createLocalStorageStore({ storage, namespace: "west" });
    const east = createLocalStorageStore({ storage, namespace: "east" });
    const created = await west.add(sample);

    expect(east.list()).toEqual([]);
    expect(await east.update(created.id, { firstName: "Changed" })).toBeNull();
    expect(await east.remove(created.id)).toBe(false);
    expect(west.list()[0]?.firstName).toBe("Sam");
    expect(storageKey("west")).not.toBe(storageKey("east"));
  });

  it("ignores unreadable saved data and records that have no name", () => {
    const storage = new MemoryStorage();
    storage.setItem(storageKey(), "{");
    expect(createLocalStorageStore({ storage }).list()).toEqual([]);

    storage.setItem(storageKey(), JSON.stringify({ nope: true }));
    expect(createLocalStorageStore({ storage }).list()).toEqual([]);

    storage.setItem(
      storageKey(),
      JSON.stringify([
        { id: "skip-me" },
        { id: "keep", firstName: "Avery", lastContacted: "not-a-date", category: "" },
      ]),
    );
    const list = createLocalStorageStore({ storage }).list();
    expect(list.map((contact) => contact.firstName)).toEqual(["Avery"]);
    expect(list[0]?.lastContacted).toBe("");
    expect(list[0]?.category).toBe("Uncategorized");
  });

  it("keeps the open list when the device cannot save, and reports that", async () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new Error("quota");
    };
    const store = createLocalStorageStore({ storage });
    const created = await store.add(sample);
    expect(store.status).toBe("tab");
    expect(store.list().map((contact) => contact.id)).toEqual([created.id]);
    expect(createLocalStorageStore({ storage }).list()).toEqual([]);
  });

  it("rejects a blank first name", async () => {
    const store = createMemoryStore();
    await expect(store.add({ ...sample, firstName: "   " })).rejects.toThrow(/first name/i);
  });

  it("starts empty when this process has no browser storage", () => {
    expect(typeof window).toBe("undefined");
    const store = createContactStore();
    expect(store.status).toBe("tab");
    expect(store.list()).toEqual([]);
  });
});
