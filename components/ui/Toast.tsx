import { cn } from "@/lib/class-names";

export type ToastMessage = { id: number; text: string };

export function Toast({ message }: { message: ToastMessage | null }) {
  return (
    <div className={cn("toast", message && "is-visible")} role="status" aria-live="polite">
      {message?.text ?? ""}
    </div>
  );
}
