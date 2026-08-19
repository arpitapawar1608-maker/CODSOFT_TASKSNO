const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_RE = /^\+?[0-9]{7,15}$/;

export const FIELDS = ["name", "email", "phone", "city", "age", "department"];

/**
 * Validate a raw record. Returns { valid, errors, clean }.
 * Invalid records are never written to the database.
 */
export function validateRecord(raw) {
  const errors = [];
  const clean = {};

  const str = (v) => (v === undefined || v === null ? "" : String(v).trim());

  clean.name = str(raw.name).replace(/\s+/g, " ");
  clean.email = str(raw.email).toLowerCase();
  clean.phone = str(raw.phone).replace(/[\s\-()]/g, "");
  clean.city = str(raw.city).replace(/\s+/g, " ");
  clean.department = str(raw.department).replace(/\s+/g, " ");
  const ageRaw = str(raw.age);
  clean.age = ageRaw === "" ? null : Number(ageRaw);

  if (!clean.name) errors.push("Name is required");
  else if (clean.name.length > 80) errors.push("Name exceeds 80 characters");
  else if (!/[a-z]/i.test(clean.name)) errors.push("Name must contain letters");

  if (!clean.email) errors.push("Email is required");
  else if (!EMAIL_RE.test(clean.email)) errors.push(`Invalid email format: "${clean.email}"`);
  else if (clean.email.length > 120) errors.push("Email exceeds 120 characters");

  if (clean.phone && !PHONE_RE.test(clean.phone))
    errors.push(`Invalid phone number: "${clean.phone}"`);

  if (clean.age !== null) {
    if (!Number.isFinite(clean.age)) errors.push("Age must be a number");
    else if (clean.age < 0 || clean.age > 120) errors.push("Age must be between 0 and 120");
  }

  if (clean.city.length > 60) errors.push("City exceeds 60 characters");
  if (clean.department.length > 60) errors.push("Department exceeds 60 characters");

  return { valid: errors.length === 0, errors, clean };
}
