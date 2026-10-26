"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { categoryStyle } from "@/lib/categories";
import { cn } from "@/lib/class-names";
import { fullName, initials } from "@/lib/contacts";
import { daysSince, formatDateLong, isStale, relativeLabel, toISODate } from "@/lib/dates";
import type { Contact, ContactInput, ContactPatch } from "@/lib/types";
import { IconBack, IconCheck, IconClock, IconPerson } from "./Icons";
import { PersonFields } from "./PersonFields";
import { Button } from "./ui/Button";
import { TextArea } from "./ui/TextField";

export function ProfilePane({
  contact,
  categories,
  onBack,
  onUpdate,
  onRemove,
  onNotify,
}: {
  contact: Contact | null;
  categories: readonly string[];
  onBack: () => void;
  onUpdate: (id: string, patch: ContactPatch) => Promise<Contact | null>;
  onRemove: (id: string) => Promise<boolean>;
  onNotify: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState(contact?.notes ?? "");
  const [hint, setHint] = useState("");
  const [seenId, setSeenId] = useState(contact?.id ?? null);
  const [editValues, setEditValues] = useState<ContactInput | null>(null);
  const pending = useRef<{ id: string; notes: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  if (contact && seenId !== contact.id) {
    setSeenId(contact.id);
    setDraft(contact.notes);
    setHint("");
    setEditing(false);
    setConfirming(false);
    setEditValues(null);
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const job = pending.current;
      pending.current = null;
      if (job) void onUpdate(job.id, { notes: job.notes });
    };
  }, [contact?.id, onUpdate]);

  function scheduleNotes(value: string) {
    if (!contact) return;
    setDraft(value);
    setHint("Saving…");
    pending.current = { id: contact.id, notes: value };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const job = pending.current;
      pending.current = null;
      timer.current = null;
      if (!job) return;
      void onUpdate(job.id, { notes: job.notes }).then((updated) => {
        if (!mounted.current) return;
        setHint(updated ? "Saved" : "Could not save");
      });
    }, 650);
  }

  async function logToday() {
    if (!contact) return;
    const updated = await onUpdate(contact.id, { lastContacted: toISODate(new Date()) });
    onNotify(updated ? "Logged a conversation for today." : "Could not save that change.");
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!contact || !editValues || !editValues.firstName.trim()) return;
    const updated = await onUpdate(contact.id, {
      firstName: editValues.firstName,
      lastName: editValues.lastName,
      company: editValues.company,
      email: editValues.email,
      phone: editValues.phone,
      category: editValues.category,
      lastContacted: editValues.lastContacted,
    });
    if (!updated) {
      onNotify("Could not save that change.");
      return;
    }
    setEditing(false);
    onNotify("Saved.");
  }

  async function removePerson() {
    if (!contact) return;
    const name = fullName(contact);
    const removed = await onRemove(contact.id);
    onNotify(removed ? `Removed ${name}.` : "Could not remove that person.");
  }

  return (
    <section className="profile-pane" aria-label="Profile">
      <div className="back-row">
        <Button variant="ghost" onClick={onBack}>
          <IconBack />
          All people
        </Button>
      </div>
      {!contact ? (
        <div className="empty-state profile-empty">
          <IconPerson size={40} />
          <p className="empty-title">Choose a person</p>
          <p className="empty-detail">Their details and notes show up here.</p>
        </div>
      ) : editing && editValues ? (
        <div className="profile-inner">
          <h2 className="section-title">Edit details</h2>
          <form className="edit-form" onSubmit={saveEdit}>
            <PersonFields
              values={editValues}
              categories={categories}
              idPrefix="edit-person"
              onChange={(patch) => setEditValues((current) => (current ? { ...current, ...patch } : current))}
            />
            <div className="form-actions">
              <Button variant="primary" type="submit">
                Save changes
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  setEditValues(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <ProfileView
          contact={contact}
          draft={draft}
          hint={hint}
          confirming={confirming}
          onEdit={() => {
            setEditValues({
              firstName: contact.firstName,
              lastName: contact.lastName,
              company: contact.company,
              email: contact.email,
              phone: contact.phone,
              category: contact.category,
              lastContacted: contact.lastContacted,
              notes: contact.notes,
            });
            setEditing(true);
            setConfirming(false);
          }}
          onLogToday={() => void logToday()}
          onNotes={scheduleNotes}
          onAskRemove={() => setConfirming(true)}
          onKeep={() => setConfirming(false)}
          onRemove={() => void removePerson()}
        />
      )}
    </section>
  );
}

function ProfileView({
  contact,
  draft,
  hint,
  confirming,
  onEdit,
  onLogToday,
  onNotes,
  onAskRemove,
  onKeep,
  onRemove,
}: {
  contact: Contact;
  draft: string;
  hint: string;
  confirming: boolean;
  onEdit: () => void;
  onLogToday: () => void;
  onNotes: (value: string) => void;
  onAskRemove: () => void;
  onKeep: () => void;
  onRemove: () => void;
}) {
  const style = categoryStyle(contact.category || "Uncategorized");
  const stale = isStale(contact);
  const days = daysSince(contact.lastContacted);
  return (
    <div className="profile-inner">
      <header className="profile-header">
        <span className="avatar avatar-lg" style={{ background: style.avatar }}>
          {initials(contact)}
        </span>
        <div className="profile-heading">
          <h2 className="profile-name">{fullName(contact)}</h2>
          <div className="chip-row">
            <span className="chip" style={{ background: style.chipBg, color: style.chipText }}>
              {contact.category || "Uncategorized"}
            </span>
            {contact.company ? <span className="chip chip-neutral">{contact.company}</span> : null}
          </div>
        </div>
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      </header>

      {stale && days !== null ? (
        <p className="notice notice-warn" role="status">
          <IconClock />
          Last spoke {days} days ago. A short check-in would help.
        </p>
      ) : null}

      <dl className="info-grid">
        <div>
          <dt>Email</dt>
          <dd>
            {contact.email ? (
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            ) : (
              <span className="muted">Not on file</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>
            {contact.phone ? (
              <a href={`tel:${contact.phone}`}>{contact.phone}</a>
            ) : (
              <span className="muted">Not on file</span>
            )}
          </dd>
        </div>
        <div className="span-2">
          <dt>Last spoke</dt>
          <dd>
            {contact.lastContacted ? (
              <span className="tnum">
                {formatDateLong(contact.lastContacted)}
                <span className="muted"> ({relativeLabel(contact.lastContacted)})</span>
              </span>
            ) : (
              <span className="muted">Not on file</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="contacted-row">
        <Button variant="primary" onClick={onLogToday}>
          <IconCheck />
          Log a conversation today
        </Button>
      </div>

      <div className="notes-section">
        <div className="section-head">
          <h3 className="section-title">Notes</h3>
          <span className={cn("save-hint", hint === "Saved" && "is-saved")} aria-live="polite">
            {hint}
          </span>
        </div>
        <TextArea
          label="Notes"
          hideLabel
          className="notes-field"
          value={draft}
          placeholder="Anything you want to remember for next time."
          onChange={(event) => onNotes(event.target.value)}
        />
      </div>

      <div className="delete-zone">
        {confirming ? (
          <div className="confirm-box" role="group" aria-label="Confirm removal">
            <p>Remove {fullName(contact)}? This cannot be undone.</p>
            <div className="confirm-actions">
              <Button variant="secondary" onClick={onKeep}>
                Keep
              </Button>
              <Button variant="danger-solid" onClick={onRemove}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" onClick={onAskRemove}>
            Remove this person
          </Button>
        )}
      </div>
    </div>
  );
}
