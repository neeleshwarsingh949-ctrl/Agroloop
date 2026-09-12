export function normalizePhone(raw?: string) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  // return last 10 digits (Indian mobile assumption)
  return digits.slice(-10);
}

export default normalizePhone;
