import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
const file = path.join(dir, "db.json");

const empty = {
  records: [],
  logs: [],
  stats: {
    received: 0,
    stored: 0,
    duplicates: 0,
    invalid: 0,
    bytesSaved: 0,
  },
};

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucket = process.env.AWS_S3_BUCKET;

let db = empty;

function load() {
  try {
    fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(file)) {
      db = {
        ...empty,
        ...JSON.parse(fs.readFileSync(file, "utf8")),
      };
    } else {
      save();
    }
  } catch {
    db = structuredClone(empty);
  }
}

async function uploadToS3() {
  if (!bucket) {
    console.error("AWS_S3_BUCKET is not configured");
    return;
  }

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: "db.json",
        Body: JSON.stringify(db, null, 2),
        ContentType: "application/json",
      }),
    );

    console.log("Database uploaded to AWS S3");
  } catch (error) {
    console.error("S3 upload failed:", error.message);
  }
}

function save() {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(db, null, 2));

  uploadToS3();
}

load();

export const getDb = () => db;

export const getRecords = () => db.records;

export const getLogs = () => db.logs.slice(-200).reverse();

export function insertRecord(rec) {
  const row = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...rec,
  };

  db.records.push(row);
  db.stats.stored++;

  save();

  return row;
}

export function log(entry) {
  db.logs.push({
    at: new Date().toISOString(),
    ...entry,
  });

  if (db.logs.length > 1000) {
    db.logs = db.logs.slice(-1000);
  }
}

export function bump(patch) {
  for (const [k, v] of Object.entries(patch)) {
    db.stats[k] = (db.stats[k] || 0) + v;
  }
}

export function deleteRecord(id) {
  const before = db.records.length;

  db.records = db.records.filter((r) => r.id !== id);

  const removed = before !== db.records.length;

  if (removed) {
    db.stats.stored = db.records.length;
  }

  save();

  return removed;
}

export function reset() {
  db = structuredClone(empty);
  save();
}

export function persist() {
  save();
}

export function stats() {
  const s = db.stats;
  const rejected = s.duplicates + s.invalid;

  return {
    ...s,
    stored: db.records.length,
    rejected,
    dedupRatio: s.received
      ? +((s.duplicates / s.received) * 100).toFixed(1)
      : 0,
    qualityScore: s.received
      ? +(((s.received - rejected) / s.received) * 100).toFixed(1)
      : 100,
    dbBytes: Buffer.byteLength(JSON.stringify(db.records)),
  };
}