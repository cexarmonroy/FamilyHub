export type FamilyMember = {
  id: string;
  full_name: string;
  birth_date: string | null;
  relation: string;
  notes: string | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  event_at: string;
  read_at: string | null;
};
