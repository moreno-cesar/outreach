import { categoryStyle } from "@/lib/categories";
import { cn } from "@/lib/class-names";
import { categoryCount } from "@/lib/contacts";
import type { Contact } from "@/lib/types";
import type { StorageStatus } from "@/lib/storage/store";
import { StorageNote } from "./StorageNote";

export function CategoryNav({
  contacts,
  categories,
  active,
  onSelect,
  status,
  variant,
}: {
  contacts: readonly Contact[];
  categories: readonly string[];
  active: string;
  onSelect: (category: string) => void;
  status: StorageStatus;
  variant: "sidebar" | "chips";
}) {
  const items = ["All", ...categories];

  if (variant === "chips") {
    return (
      <nav className="cat-bar" aria-label="Categories">
        {items.map((name) => (
          <button
            key={name}
            type="button"
            className={cn("cat-chip", active === name && "is-active")}
            aria-current={active === name ? "true" : undefined}
            onClick={() => onSelect(name)}
          >
            {name === "All" ? "All people" : name}
            <span className="cat-chip-count tnum">{categoryCount(contacts, name)}</span>
          </button>
        ))}
      </nav>
    );
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          O
        </span>
        <div>
          <p className="brand-name">Outreach</p>
          <p className="brand-tagline">People worth staying in touch with</p>
        </div>
      </div>
      <p className="nav-label">Categories</p>
      <nav aria-label="Categories">
        <ul className="cat-list">
          {items.map((name) => {
            const style = name === "All" ? null : categoryStyle(name);
            return (
              <li key={name}>
                <button
                  type="button"
                  className={cn("cat-item", active === name && "is-active")}
                  aria-current={active === name ? "page" : undefined}
                  onClick={() => onSelect(name)}
                >
                  <span
                    className="cat-dot"
                    style={style ? { background: style.avatar } : undefined}
                    aria-hidden="true"
                  />
                  <span className="cat-label">{name === "All" ? "All people" : name}</span>
                  <span className="cat-count tnum">{categoryCount(contacts, name)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="sidebar-foot">
        <StorageNote status={status} />
      </div>
    </aside>
  );
}
