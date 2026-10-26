"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  computeStats,
  filterContacts,
  fullName,
  orderedCategories,
  type QuickFilter,
  type SortKey,
} from "@/lib/contacts";
import { createContactStore } from "@/lib/storage/store";
import type { ContactInput, ContactPatch } from "@/lib/types";
import { AddPersonDialog } from "./AddPersonDialog";
import { CategoryNav } from "./CategoryNav";
import { ContactList } from "./ContactList";
import { ProfilePane } from "./ProfilePane";
import { StatsBar } from "./StatsBar";
import { Toast, type ToastMessage } from "./ui/Toast";

export function OutreachApp() {
  const [store] = useState(() => createContactStore());
  const toastId = useRef(0);
  const contacts = useSyncExternalStore(
    useCallback((listener: () => void) => store.subscribe(() => listener()), [store]),
    useCallback(() => store.list(), [store]),
    useCallback(() => store.list(), [store]),
  );
  const status = store.status;
  const [category, setCategory] = useState("All");
  const [quickFilter, setQuickFilter] = useState<QuickFilter | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pane, setPane] = useState<"list" | "profile">("list");
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string) => {
    const id = toastId.current + 1;
    toastId.current = id;
    setToast({ id, text });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2600);
  }, []);

  const categories = useMemo(() => orderedCategories(contacts), [contacts]);
  const stats = useMemo(() => computeStats(contacts), [contacts]);
  const visible = useMemo(
    () => filterContacts({ contacts, category, quickFilter, search, sort }),
    [contacts, category, quickFilter, search, sort],
  );
  const selected = contacts.find((contact) => contact.id === selectedId) ?? null;
  const visiblePane = selected ? pane : "list";

  const updateContact = useCallback(
    async (id: string, patch: ContactPatch) => store.update(id, patch),
    [store],
  );

  const removeContact = useCallback(async (id: string) => store.remove(id), [store]);

  async function addContact(input: ContactInput) {
    try {
      const created = await store.add(input);
      setSelectedId(created.id);
      setCategory("All");
      setQuickFilter(null);
      setSearch("");
      setPane("profile");
      setAddOpen(false);
      showToast(`Added ${fullName(created)}.`);
    } catch {
      showToast("Add a first name to continue.");
    }
  }

  return (
    <div className="app">
      <a className="skip-link" href="#people">
        Skip to people
      </a>
      <StatsBar
        attention={stats.attention}
        cold={stats.cold}
        followup={stats.followup}
        active={quickFilter}
        ready
        onToggle={(filter) => {
          setQuickFilter((current) => (current === filter ? null : filter));
          setCategory("All");
        }}
      />
      <div className="body">
        <CategoryNav
          variant="sidebar"
          contacts={contacts}
          categories={categories}
          active={category}
          status={status}
          onSelect={(name) => {
            setCategory(name);
            setQuickFilter(null);
          }}
        />
        <div className="main-column">
          <CategoryNav
            variant="chips"
            contacts={contacts}
            categories={categories}
            active={category}
            status={status}
            onSelect={(name) => {
              setCategory(name);
              setQuickFilter(null);
            }}
          />
          <div className={`panes panes-${visiblePane}`}>
            <ContactList
              visible={visible}
              category={category}
              quickFilter={quickFilter}
              search={search}
              sort={sort}
              selectedId={selected ? selectedId : null}
              ready
              totalCount={contacts.length}
              status={status}
              onSearch={setSearch}
              onSort={setSort}
              onSelect={(id) => {
                setSelectedId(id);
                setPane("profile");
              }}
              onAdd={() => setAddOpen(true)}
            />
            <ProfilePane
              contact={selected}
              categories={categories}
              onBack={() => setPane("list")}
              onUpdate={updateContact}
              onRemove={removeContact}
              onNotify={showToast}
            />
          </div>
        </div>
      </div>
      {addOpen ? (
        <AddPersonDialog
          defaultCategory={category}
          categories={categories}
          onClose={() => setAddOpen(false)}
          onAdd={(input) => void addContact(input)}
        />
      ) : null}
      <Toast message={toast} />
    </div>
  );
}
