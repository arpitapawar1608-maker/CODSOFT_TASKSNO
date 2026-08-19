import crypto from "node:crypto";

const norm = (v) =>
  String(v ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Canonical, order-stable signature of the meaningful fields. */
export function fingerprint(rec) {
  const canonical = [
    norm(rec.name),
    norm(rec.email),
    norm(rec.phone),
    norm(rec.city),
    rec.age ?? "",
    norm(rec.department),
  ].join("|");
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

/** Email key ignoring dots and +tags in the local part (gmail-style aliases). */
export function emailKey(email) {
  const e = norm(email);
  const [local, domain] = e.split("@");
  if (!domain) return e;
  return `${local.split("+")[0].replace(/\./g, "")}@${domain}`;
}

export function phoneKey(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

export function similarity(a, b) {
  a = norm(a);
  b = norm(b);
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const max = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / max;
}

/**
 * Compare a candidate against existing records.
 * Returns null (unique) or { type, match, score, reason }.
 */
export function findDuplicate(candidate, existing, threshold = 0.88) {
  const fp = fingerprint(candidate);
  const ek = emailKey(candidate.email);
  const pk = phoneKey(candidate.phone);

  for (const rec of existing) {
    if (rec.fingerprint === fp)
      return { type: "exact", match: rec, score: 1, reason: "Identical fingerprint (SHA-256)" };
  }

  for (const rec of existing) {
    if (ek && emailKey(rec.email) === ek)
      return { type: "exact", match: rec, score: 1, reason: `Email already registered (${rec.email})` };
  }

  let best = null;
  for (const rec of existing) {
    const nameScore = similarity(candidate.name, rec.name);
    const samePhone = pk && phoneKey(rec.phone) === pk;
    const score = samePhone ? Math.max(nameScore, 0.9) : nameScore;
    if (score >= threshold && (samePhone || nameScore >= threshold)) {
      if (!best || score > best.score) {
        best = {
          type: "near",
          match: rec,
          score,
          reason: samePhone
            ? `Same phone number as "${rec.name}"`
            : `${Math.round(score * 100)}% name similarity with "${rec.name}"`,
        };
      }
    }
  }
  return best;
}
