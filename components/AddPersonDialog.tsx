"use client";

import { useState } from "react";
import { toISODate } from "@/lib/dates";
import type { ContactInput } from "@/lib/types";
import { PersonFields } from "./PersonFields";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

function blank(category: string): ContactInput {
  return {
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    category: category === "All" ? "Client" : category,
    lastContacted: toISODate(new Date()),
    notes: "",
  };
}

export function AddPersonDialog({
  defaultCategory,
  categories,
  onClose,
  onAdd,
}: {
  defaultCategory: string;
  categories: readonly string[];
  onClose: () => void;
  onAdd: (input: ContactInput) => void;
}) {
  const [values, setValues] = useState<ContactInput>(() => blank(defaultCategory));

  return (
    <Modal open title="Add a person" subtitle="A name is enough to start." onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!values.firstName.trim()) return;
          onAdd(values);
        }}
      >
        <PersonFields
          values={values}
          categories={categories}
          idPrefix="add-person"
          onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
        />
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Add person
          </Button>
        </div>
      </form>
    </Modal>
  );
}
