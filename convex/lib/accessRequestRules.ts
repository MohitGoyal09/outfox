
export const LIMITS = { name: 80, company: 120, note: 500, email: 254 } as const;

export type AccessRequestInput = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  note?: unknown;
  website?: unknown;
};
export type AccessRequestValue = {
  name: string;
  email: string;
  company: string;
  note?: string;
};
export type FieldErrors = Partial<Record<"name" | "email" | "company" | "note", string>>;
export type ParsedAccessRequest =
  | { kind: "honeypot" }
  | { kind: "invalid"; errors: FieldErrors }
  | { kind: "ok"; value: AccessRequestValue };

export function isPlausibleEmail(email: string): boolean {
}
