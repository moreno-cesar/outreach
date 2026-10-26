/** A person an agent wants to stay in touch with. */
export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  category: string;
  /** Local calendar date, YYYY-MM-DD. Empty when a conversation has never been logged. */
  lastContacted: string;
  notes: string;
  createdAt: string;
};

export type ContactInput = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  category: string;
  lastContacted: string;
  notes: string;
};

export type ContactPatch = Partial<ContactInput>;
