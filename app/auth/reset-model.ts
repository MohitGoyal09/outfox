
export type ResetStep = "email" | "code";
export const MSG_SEND_FAILED = "Could not send the reset email. Try again in a minute.";
export const MSG_SEND_GENERIC = "Could not send a code. Check the email address and try again.";
export const MSG_VERIFY_GENERIC = "That code is wrong or expired. Request a new one.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  return EMAIL_RE.test(email.trim()) ? null : "Enter a valid email address.";
}

export function validateResetForm(code: string, newPassword: string): string | null {
  return validateCode(code) ?? validateNewPassword(newPassword);
}

export function nextStep(step: ResetStep, event: "codeSent" | "back"): ResetStep {
  if (event === "back") return "email";
  return step === "email" ? "code" : step;
}

export function canResend(secondsSinceSend: number): boolean {
  return secondsSinceSend >= RESEND_COOLDOWN_SECONDS;
}

export function revealSendError(mapped: string, isProduction: boolean): boolean {
  return !isProduction && (mapped === MSG_NOT_SET_UP || mapped === MSG_SEND_FAILED);
}
