import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateRecord } from "./validate.js";
import { fingerprint, findDuplicate } from "./dedupe.js";
import * as db from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");
const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

const json = (res, code, body) => {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 5e6) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

/** Core pipeline: validate -> dedupe -> store. */
function ingest(records, { dryRun = false } = {}) {
  const results = [];
  let accepted = 0,
    duplicates = 0,
    invalid = 0,
    bytesSaved = 0;

  for (const raw of records) {
    const { valid, errors, clean } = validateRecord(raw);
    const size = Buffer.byteLength(JSON.stringify(clean));

    if (!valid) {
      invalid++;
      bytesSaved += size;
      results.push({ status: "invalid", record: clean, errors });
      if (!dryRun) db.log({ status: "invalid", record: clean, reason: errors.join("; ") });
      continue;
    }

    const pool = db.getRecords();
    const dup = findDuplicate(clean, pool);
    if (dup) {
      duplicates++;
      bytesSaved += size;
      results.push({
        status: dup.type === "exact" ? "duplicate" : "near-duplicate",
        record: clean,
        score: dup.score,
        reason: dup.reason,
        matchedId: dup.match.id,
        matchedName: dup.match.name,
      });
      if (!dryRun)
        db.log({ status: "duplicate", record: clean, reason: dup.reason, matchedId: dup.match.id });
      continue;
    }

    accepted++;
    results.push({ status: "stored", record: clean });
    if (!dryRun) db.insertRecord({ ...clean, fingerprint: fingerprint(clean), verified: true });
  }

  if (!dryRun) {
    db.bump({ received: records.length, duplicates, invalid, bytesSaved });
    db.persist();
  }

  return {
    summary: { received: records.length, accepted, duplicates, invalid, bytesSaved },
    results,
    stats: db.stats(),
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  try {
    if (p.startsWith("/api/")) {
      if (req.method === "GET" && p === "/api/records")
        return json(res, 200, { records: [...db.getRecords()].reverse() });

      if (req.method === "GET" && p === "/api/stats") return json(res, 200, db.stats());

      if (req.method === "GET" && p === "/api/logs") return json(res, 200, { logs: db.getLogs() });

      if (req.method === "POST" && (p === "/api/records" || p === "/api/validate")) {
        const body = await readBody(req);
        const records = Array.isArray(body.records)
          ? body.records
          : body.record
            ? [body.record]
            : null;
        if (!records) return json(res, 400, { error: "Expected { records: [...] }" });
        if (records.length > 5000) return json(res, 413, { error: "Max 5000 records per upload" });
        return json(res, 200, ingest(records, { dryRun: p === "/api/validate" }));
      }

      if (req.method === "DELETE" && p.startsWith("/api/records/")) {
        const ok = db.deleteRecord(decodeURIComponent(p.split("/").pop()));
        return json(res, ok ? 200 : 404, { ok });
      }

      if (req.method === "POST" && p === "/api/reset") {
        db.reset();
        return json(res, 200, { ok: true, stats: db.stats() });
      }

      return json(res, 404, { error: "Unknown endpoint" });
    }

    // static files
    const rel = p === "/" ? "index.html" : p.replace(/^\/+/, "");
    const file = path.join(PUBLIC, rel);
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  } catch (err) {
    json(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n  Cloud Data Duplication System`);
  console.log(`  → http://localhost:${PORT}\n`);
});
