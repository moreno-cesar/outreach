import type { ChangeEvent } from "react";
import { categorySuggestions } from "@/lib/categories";
import type { ContactInput, ContactPatch } from "@/lib/types";
import { TextField } from "./ui/TextField";

export function PersonFields({
  values,
  onChange,
  categories,
  idPrefix,
}: {
  values: ContactInput;
  onChange: (patch: ContactPatch) => void;
  categories: readonly string[];
  idPrefix: string;
}) {
  const listId = `${idPrefix}-categories`;
  const suggestions = categorySuggestions(categories);

  function field(key: keyof ContactInput) {
    return (event: ChangeEvent<HTMLInputElement>) => onChange({ [key]: event.target.value });
  }

  return (
    <>
    <div className="form-grid">
      <TextField
        className="span-2"
        label="First name"
        required
        value={values.firstName}
        onChange={field("firstName")}
        autoComplete="given-name"
      />
      <TextField label="Last name" value={values.lastName} onChange={field("lastName")} autoComplete="family-name" />
      <TextField
        label="Category"
        value={values.category}
        onChange={field("category")}
        placeholder="Client"
        list={listId}
        autoComplete="off"
      />
      <TextField
        className="span-2"
        label="Company"
        value={values.company}
        onChange={field("company")}
        autoComplete="organization"
      />
      <TextField
        label="Email"
        type="email"
        value={values.email}
        onChange={field("email")}
        autoComplete="email"
        placeholder="name@example.com"
        inputMode="email"
      />
      <TextField
        label="Phone"
        type="tel"
        value={values.phone}
        onChange={field("phone")}
        autoComplete="tel"
        placeholder="555-0100"
        inputMode="tel"
      />
      <TextField
        className="span-2"
        label="Last spoke"
        type="date"
        value={values.lastContacted}
        onChange={field("lastContacted")}
      />
    </div>
    <datalist id={listId}>
      {suggestions.map((name) => (
        <option key={name} value={name} />
      ))}
    </datalist>
    </>
  );
}
