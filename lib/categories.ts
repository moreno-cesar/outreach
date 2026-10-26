export const CATEGORY_ORDER = ["Manager", "Client", "Vendor"] as const;

const KNOWN = new Set<string>(CATEGORY_ORDER);

export type CategoryStyle = {
  avatar: string;
  chipBg: string;
  chipText: string;
};

const KNOWN_STYLES: Record<string, CategoryStyle> = {
  Manager: {
    avatar: "var(--color-accent)",
    chipBg: "var(--color-accent-soft)",
    chipText: "var(--color-accent-strong)",
  },
  Client: {
    avatar: "var(--color-sage)",
    chipBg: "var(--color-sage-soft)",
    chipText: "var(--color-sage-text)",
  },
  Vendor: {
    avatar: "var(--color-plum)",
    chipBg: "var(--color-plum-soft)",
    chipText: "var(--color-plum-text)",
  },
};

const FALLBACK_AVATARS = ["#5C6570", "#4E6158", "#6A5848", "#5A5368"];

export function categoryStyle(category: string): CategoryStyle {
  const known = KNOWN_STYLES[category];
  if (known) return known;
  let index = 0;
  for (let i = 0; i < category.length; i += 1) {
    index = (index + category.charCodeAt(i)) % FALLBACK_AVATARS.length;
  }
  return {
    avatar: FALLBACK_AVATARS[index] ?? FALLBACK_AVATARS[0],
    chipBg: "var(--color-surface-2)",
    chipText: "var(--color-text-secondary)",
  };
}

/** Built-in categories first, then any categories already in use. */
export function categorySuggestions(existing: readonly string[]): string[] {
  const extras = [...new Set(existing.filter((name) => name && !KNOWN.has(name)))].sort((a, b) =>
    a.localeCompare(b),
  );
  return [...CATEGORY_ORDER, ...extras];
}
