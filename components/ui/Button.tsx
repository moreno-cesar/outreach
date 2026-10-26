import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "danger-solid";
};

export function Button({
  variant = "secondary",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return <button type={type} className={cn("btn", `btn-${variant}`, className)} {...props} />;
}
