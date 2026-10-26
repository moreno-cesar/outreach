import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
};

export function TextField({ label, hint, id, className, required, ...props }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className={cn("field", className)}>
      <label htmlFor={fieldId}>
        {label}
        {required ? <span className="field-required"> (required)</span> : null}
      </label>
      <input id={fieldId} className="text-input" required={required} {...props} />
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hideLabel?: boolean;
};

export function TextArea({ label, hideLabel = false, id, className, ...props }: TextAreaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className={cn("field", className)}>
      <label htmlFor={fieldId} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </label>
      <textarea id={fieldId} className="text-input notes-input" {...props} />
    </div>
  );
}
