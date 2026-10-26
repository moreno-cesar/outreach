import { parseISODate } from "../dates";
import type { Contact, ContactInput, ContactPatch } from "../types";

/**
 * The only way screens read and write people.
 *
 * `device` means the current adapter saved the list on this browser.
 * `tab` means a save could not be stored, so the list lasts until the tab closes.
 *
 * A Supabase adapter can implement this same interface later. Screens should not
 * import localStorage, network clients, or a database SDK directly.
 */
export type StorageStatus = "device" | "tab";

export interface ContactStore {
  readonly status: StorageStatus;
  list(): Contact[];
  subscribe(listener: (contacts: Contact[]) => void): () => void;
  add(input: ContactInput): Promise<Contact>;
  update(id: string, patch: ContactPatch): Promise<Contact | null>;
  remove(id: string): Promise<boolean>;
}

const KEY_PREFIX = "outreach.contacts.v1";

export function storageKey(namespace = "default"): string {
  return `${KEY_PREFIX}:${namespace}`;
}

function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function cleanDate(value: string): string {
  const trimmed = value.trim();
  return parseISODate(trimmed) ? trimmed : "";
}

function clone(contact: Contact): Contact {
  return { ...contact };
}

export function coerceContact(value: unknown): Contact | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || record.id.trim() === "") return null;
  const firstName = asString(record.firstName).trim();
  if (!firstName) return null;
  const lastContacted = asString(record.lastContacted).trim();
  return {
    id: record.id,
    firstName,
    lastName: asString(record.lastName).trim(),
    company: asString(record.company).trim(),
    email: asString(record.email).trim(),
    phone: asString(record.phone).trim(),
    category: asString(record.category).trim() || "Uncategorized",
    lastContacted: parseISODate(lastContacted) ? lastContacted : "",
    notes: asString(record.notes),
    createdAt: asString(record.createdAt) || new Date(0).toISOString(),
  };
}

function contactFromInput(input: ContactInput): Contact {
  const firstName = input.firstName.trim();
  if (!firstName) throw new Error("First name is required.");
  return {
    id: createId(),
    firstName,
    lastName: input.lastName.trim(),
    company: input.company.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    category: input.category.trim() || "Uncategorized",
    lastContacted: cleanDate(input.lastContacted),
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };
}

function applyPatch(current: Contact, patch: ContactPatch): Contact {
  const next = clone(current);
  if (patch.firstName !== undefined) {
    const firstName = patch.firstName.trim();
    if (!firstName) throw new Error("First name is required.");
    next.firstName = firstName;
  }
  if (patch.lastName !== undefined) next.lastName = patch.lastName.trim();
  if (patch.company !== undefined) next.company = patch.company.trim();
  if (patch.email !== undefined) next.email = patch.email.trim();
  if (patch.phone !== undefined) next.phone = patch.phone.trim();
  if (patch.category !== undefined) next.category = patch.category.trim() || "Uncategorized";
  if (patch.lastContacted !== undefined) next.lastContacted = cleanDate(patch.lastContacted);
  if (patch.notes !== undefined) next.notes = patch.notes;
  return next;
}

function readStored(raw: string | null): Contact[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(coerceContact).filter((contact): contact is Contact => contact !== null);
  } catch {
    return [];
  }
}

type Persistence = {
  initialStatus: StorageStatus;
  read: () => Contact[];
  write: (contacts: Contact[]) => void;
  /** Called when another tab may have changed the saved list. */
  listen?: (onChange: () => void) => () => void;
};

function createStore(persistence: Persistence): ContactStore {
  let status: StorageStatus = persistence.initialStatus;
  let contacts: Contact[] = [];
  try {
    contacts = persistence.read().map(clone);
  } catch {
    contacts = [];
    status = "tab";
  }

  const listeners = new Set<(contacts: Contact[]) => void>();
  let detachListen: (() => void) | null = null;
  let cached = contacts.map(clone);

  function publish(): void {
    cached = contacts.map(clone);
    listeners.forEach((listener) => listener(cached));
  }

  function commit(): void {
    try {
      persistence.write(contacts.map(clone));
    } catch {
      status = "tab";
    }
    publish();
  }

  function ensureListen(): void {
    if (detachListen || !persistence.listen || listeners.size === 0) return;
    detachListen = persistence.listen(() => {
      try {
        contacts = persistence.read().map(clone);
      } catch {
        status = "tab";
        return;
      }
      publish();
    });
  }

  return {
    get status() {
      return status;
    },
    list() {
      return cached;
    },
    subscribe(listener) {
      listeners.add(listener);
      ensureListen();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && detachListen) {
          detachListen();
          detachListen = null;
        }
      };
    },
    async add(input) {
      const contact = contactFromInput(input);
      contacts = [...contacts, contact];
      commit();
      return clone(contact);
    },
    async update(id, patch) {
      const current = contacts.find((contact) => contact.id === id);
      if (!current) return null;
      const next = applyPatch(current, patch);
      contacts = contacts.map((contact) => (contact.id === id ? next : contact));
      commit();
      return clone(next);
    },
    async remove(id) {
      if (!contacts.some((contact) => contact.id === id)) return false;
      contacts = contacts.filter((contact) => contact.id !== id);
      commit();
      return true;
    },
  };
}

export function createMemoryStore(): ContactStore {
  let records: Contact[] = [];
  return createStore({
    initialStatus: "tab",
    read: () => records,
    write: (next) => {
      records = next.map(clone);
    },
  });
}

export function createLocalStorageStore(options: {
  storage: Storage;
  namespace?: string;
}): ContactStore {
  const key = storageKey(options.namespace ?? "default");
  const storage = options.storage;
  return createStore({
    initialStatus: "device",
    read: () => readStored(storage.getItem(key)),
    write: (next) => {
      storage.setItem(key, JSON.stringify(next));
    },
    listen: (onChange) => {
      if (typeof window === "undefined") return () => {};
      const onStorage = (event: StorageEvent) => {
        if (event.key !== key) return;
        if (event.storageArea && event.storageArea !== storage) return;
        onChange();
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
  });
}

/** Browser adapter when storage exists, otherwise a tab-only list. Always starts empty. */
export function createContactStore(): ContactStore {
  if (typeof window === "undefined") return createMemoryStore();
  try {
    const probe = "outreach.__probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
  } catch {
    return createMemoryStore();
  }
  return createLocalStorageStore({ storage: window.localStorage });
}
