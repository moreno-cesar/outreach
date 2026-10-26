import { categoryStyle } from "@/lib/categories";
import { cn } from "@/lib/class-names";
import {
  fullName,
  initials,
  listTitle,
  peopleCountLabel,
  type QuickFilter,
  type SortKey,
} from "@/lib/contacts";
import { isStale, relativeLabel } from "@/lib/dates";
import type { Contact } from "@/lib/types";
import type { StorageStatus } from "@/lib/storage/store";
import { IconPerson, IconPlus, IconSearch } from "./Icons";
import { StorageNote } from "./StorageNote";
import { Button } from "./ui/Button";

export function ContactList({
  visible,
  category,
  quickFilter,
  search,
  sort,
  selectedId,
  ready,
  totalCount,
  status,
  onSearch,
  onSort,
  onSelect,
  onAdd,
}: {
  visible: readonly Contact[];
  category: string;
  quickFilter: QuickFilter | null;
  search: string;
  sort: SortKey;
  selectedId: string | null;
  ready: boolean;
  totalCount: number;
  status: StorageStatus;
  onSearch: (value: string) => void;
  onSort: (sort: SortKey) => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  const title = listTitle(category, quickFilter);
  return (
    <section className="list-pane" id="people" aria-labelledby="list-title">
      <div className="list-toolbar">
        <div className="list-toolbar-row">
          <div>
            <h1 id="list-title" className="pane-title">
              {title}
            </h1>
            <p className="pane-count">{ready ? peopleCountLabel(visible.length) : "Loading"}</p>
          </div>
          <Button variant="primary" onClick={onAdd}>
            <IconPlus />
            <span className="add-label-long">Add a person</span>
            <span className="add-label-short">Add</span>
          </Button>
        </div>
        <div className="search-wrap">
          <label className="sr-only" htmlFor="people-search">
            Search people or companies
          </label>
          <IconSearch />
          <input
            id="people-search"
            className="text-input"
            type="search"
            placeholder="Search people or companies"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="sort-row">
          <span className="sort-label" id="sort-label">
            Sort
          </span>
          <div className="segmented" role="group" aria-labelledby="sort-label">
            <button type="button" aria-pressed={sort === "name"} onClick={() => onSort("name")}>
              Name
            </button>
            <button type="button" aria-pressed={sort === "recent"} onClick={() => onSort("recent")}>
              Last contact
            </button>
          </div>
        </div>
      </div>
      <div className="contact-scroll">
        {!ready ? (
          <div className="empty-state">
            <p className="empty-title">Loading your people…</p>
          </div>
        ) : visible.length === 0 ? (
          <EmptyList
            searching={search.trim().length > 0}
            filtered={category !== "All" || quickFilter !== null}
            hasAnyone={totalCount > 0}
            onAdd={onAdd}
          />
        ) : (
          <ul className="contact-list">
            {visible.map((contact) => {
              const style = categoryStyle(contact.category || "Uncategorized");
              const stale = isStale(contact);
              const selected = contact.id === selectedId;
              return (
                <li key={contact.id}>
                  <button
                    type="button"
                    className={cn("contact-card", selected && "is-selected")}
                    aria-current={selected ? "true" : undefined}
                    onClick={() => onSelect(contact.id)}
                  >
                    <span className="avatar" style={{ background: style.avatar }}>
                      {initials(contact)}
                    </span>
                    <span className="card-main">
                      <span className="card-name">
                        {fullName(contact)}
                        {stale ? <span className="sr-only">, overdue for a check-in</span> : null}
                      </span>
                      <span className="card-sub">{contact.company || contact.category || "Uncategorized"}</span>
                    </span>
                    <span className={cn("card-last tnum", stale && "is-stale")}>
                      {relativeLabel(contact.lastContacted)}
                      {stale ? <span className="stale-dot" aria-hidden="true" /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="list-storage">
        <StorageNote status={status} compact />
      </div>
      <span className="sr-only">{totalCount} saved</span>
    </section>
  );
}

function EmptyList({
  searching,
  filtered,
  hasAnyone,
  onAdd,
}: {
  searching: boolean;
  filtered: boolean;
  hasAnyone: boolean;
  onAdd: () => void;
}) {
  const title = searching ? "No matches" : "No one here yet";
  const detail = searching
    ? "Try a different name or company."
    : filtered
      ? "No one in this group."
      : "Add a person to start. Outreach will remind you when it has been a while.";
  return (
    <div className="empty-state">
      <IconPerson size={36} />
      <p className="empty-title">{title}</p>
      <p className="empty-detail">{detail}</p>
      {!hasAnyone && !searching ? (
        <Button variant="primary" onClick={onAdd}>
          <IconPlus />
          Add a person
        </Button>
      ) : null}
    </div>
  );
}
