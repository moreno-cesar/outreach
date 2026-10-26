import { cn } from "@/lib/class-names";
import type { QuickFilter } from "@/lib/contacts";
import { IconCheck, IconClock, IconCold } from "./Icons";

const CARDS: Array<{
  key: QuickFilter;
  label: string;
  tone: "attention" | "cold" | "followup";
  icon: typeof IconClock;
}> = [
  { key: "attention", label: "Need attention", tone: "attention", icon: IconClock },
  { key: "cold", label: "Gone cold", tone: "cold", icon: IconCold },
  { key: "followup", label: "Follow up this week", tone: "followup", icon: IconCheck },
];

export function StatsBar({
  attention,
  cold,
  followup,
  active,
  ready,
  onToggle,
}: {
  attention: number;
  cold: number;
  followup: number;
  active: QuickFilter | null;
  ready: boolean;
  onToggle: (filter: QuickFilter) => void;
}) {
  const values: Record<QuickFilter, number> = { attention, cold, followup };
  return (
    <section className="stats" aria-label="Who needs a check-in" aria-busy={!ready}>
      {CARDS.map((card) => {
        const Icon = card.icon;
        const pressed = active === card.key;
        return (
          <button
            key={card.key}
            type="button"
            className={cn("stat-card", pressed && "is-active")}
            aria-pressed={pressed}
            disabled={!ready}
            onClick={() => onToggle(card.key)}
          >
            <span className={cn("stat-icon", `tone-${card.tone}`)}>
              <Icon />
            </span>
            <span className="stat-body">
              <span className="stat-value tnum">{ready ? values[card.key] : "—"}</span>
              <span className="stat-label">{card.label}</span>
            </span>
          </button>
        );
      })}
    </section>
  );
}
