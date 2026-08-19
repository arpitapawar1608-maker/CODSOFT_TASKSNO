# Cloud Data Duplication System

Detects and eliminates duplicate / invalid data records before they reach the cloud database.

## Run it (VS Code)

1. Open this folder in VS Code.
2. Requires **Node.js 18+** (no `npm install` needed — zero dependencies).
3. In the terminal:

```bash
npm start
```

4. Open http://localhost:3000

## What it does

- **Validation** – every incoming record is checked (required fields, email format, phone,
  age range, field length). Invalid records are rejected and never stored.
- **Exact duplicate detection** – SHA-256 fingerprint over normalized field values.
- **Near-duplicate detection** – fuzzy matching (Levenshtein similarity on name +
  normalized email/phone keys) catches "John Smith" vs "john  smith".
- **Only unique + verified records are persisted** to the database.
- **Storage optimisation metrics** – bytes saved by rejecting redundant records,
  deduplication ratio, and consistency stats.

## Project structure

```
server/
  index.js       HTTP server + static hosting (no framework)
  db.js          JSON-file backed database layer (swap for Mongo/Postgres easily)
  dedupe.js      fingerprinting, similarity, duplicate detection
  validate.js    record validation rules
  data/          persisted database (auto-created)
public/
  index.html     UI
  styles.css     design system
  app.js         frontend logic
```

## API

| Method | Endpoint            | Description                              |
|--------|---------------------|------------------------------------------|
| GET    | `/api/records`      | list stored (unique, verified) records   |
| POST   | `/api/records`      | ingest `{ records: [...] }`, returns report |
| POST   | `/api/validate`     | dry-run check without saving             |
| GET    | `/api/stats`        | storage & dedup metrics                  |
| GET    | `/api/logs`         | rejection audit log                      |
| DELETE | `/api/records/:id`  | delete a record                          |
| POST   | `/api/reset`        | clear the database                       |
