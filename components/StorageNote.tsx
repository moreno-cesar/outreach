import { cn } from "@/lib/class-names";
import type { StorageStatus } from "@/lib/storage/store";
import { IconShield } from "./Icons";

export function StorageNote({ status, compact = false }: { status: StorageStatus; compact?: boolean }) {
  const saved = status === "device";
  return (
    <p className={cn("storage-note", compact && "is-compact")}>
      <IconShield size={16} />
      <span>
        <span className="storage-title">{saved ? "Saved on this device" : "Not saved on this device"}</span>
        {compact ? null : (
          <span className="storage-detail">
            {saved ? "These people stay in this browser." : "Changes last until you close this tab."}
          </span>
        )}
      </span>
    </p>
  );
}
