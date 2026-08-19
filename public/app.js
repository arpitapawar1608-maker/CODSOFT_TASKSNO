const $ = (s) => document.querySelector(s);
const api = async (path, opts) => {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
};

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

const bytes = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`);

/* ---------- stats ---------- */
async function loadStats() {
  try {
    const s = await api("/api/stats");
    $("#health").classList.remove("down");
    $("#health").innerHTML = '<i class="dot"></i> Backend connected';
    $("#stats").innerHTML = [
      ["Records received", s.received, ""],
      ["Stored (unique)", s.stored, "good"],
      ["Duplicates blocked", s.duplicates, "warn"],
      ["Invalid rejected", s.invalid, "bad"],
      ["Storage saved", bytes(s.bytesSaved), "good"],
      ["Data quality", `${s.qualityScore}%`, "good"],
    ]
      .map(([label, val, cls]) => `<div class="stat ${cls}"><b>${esc(val)}</b><span>${label}</span></div>`)
      .join("");
  } catch {
    $("#health").classList.add("down");
    $("#health").innerHTML = '<i class="dot"></i> Backend offline';
  }
}

/* ---------- records ---------- */
let allRecords = [];
async function loadRecords() {
  const { records } = await api("/api/records");
  allRecords = records;
  renderRecords();
}

function renderRecords() {
  const q = $("#search").value.trim().toLowerCase();
  const rows = allRecords.filter((r) =>
    !q ? true : [r.name, r.email, r.phone, r.city, r.department].join(" ").toLowerCase().includes(q),
  );
  $("#recCount").textContent = allRecords.length;
  const tbody = $("#table tbody");
  tbody.innerHTML = rows.length
    ? rows
        .map(
          (r) => `<tr>
        <td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${esc(r.phone) || "—"}</td>
        <td>${esc(r.city) || "—"}</td><td>${r.age ?? "—"}</td><td>${esc(r.department) || "—"}</td>
        <td class="fp">${esc(r.fingerprint?.slice(0, 12))}…</td>
        <td><button class="btn ghost tiny" data-del="${esc(r.id)}">Delete</button></td>
      </tr>`,
        )
        .join("")
    : `<tr><td colspan="8" class="empty-row">No records stored yet.</td></tr>`;
}

$("#search").addEventListener("input", renderRecords);
$("#table").addEventListener("click", async (e) => {
  const id = e.target.dataset.del;
  if (!id) return;
  await api(`/api/records/${id}`, { method: "DELETE" });
  toast("Record deleted");
  refresh();
});

/* ---------- logs ---------- */
async function loadLogs() {
  const { logs } = await api("/api/logs");
  $("#logs").innerHTML = logs.length
    ? logs
        .map(
          (l) =>
            `<li class="${l.status === "duplicate" ? "dup" : "inv"}">
              <b>${l.status === "duplicate" ? "Duplicate blocked" : "Invalid rejected"}</b> —
              ${esc(l.record?.name || l.record?.email || "record")} · ${esc(l.reason)}
              <span style="float:right">${new Date(l.at).toLocaleTimeString()}</span>
            </li>`,
        )
        .join("")
    : `<li>No rejections logged.</li>`;
}

/* ---------- report ---------- */
function renderReport(data, dryRun) {
  const s = data.summary;
  $("#reportMeta").textContent =
    `${s.received} received · ${s.accepted} ${dryRun ? "would be stored" : "stored"} · ${s.duplicates} duplicate · ${s.invalid} invalid · ${bytes(s.bytesSaved)} saved`;
  const box = $("#report");
  box.classList.remove("empty");
  box.innerHTML = data.results
    .map((r) => {
      const cls = r.status === "stored" ? "stored" : r.status === "invalid" ? "invalid" : "duplicate";
      const detail =
        r.status === "invalid"
          ? r.errors.join(" · ")
          : r.status === "stored"
            ? dryRun
              ? "Passed validation and uniqueness check"
              : "Verified and written to the cloud database"
            : r.reason;
      return `<div class="res ${cls}">
        <span class="tag">${r.status}</span>
        <div><strong>${esc(r.record.name || r.record.email || "(empty record)")}</strong>
        <small>${esc(detail)}</small></div>
      </div>`;
    })
    .join("");
}

/* ---------- ingest ---------- */
async function send(records, dryRun) {
  if (!records.length) return toast("Nothing to process");
  const data = await api(dryRun ? "/api/validate" : "/api/records", {
    method: "POST",
    body: JSON.stringify({ records }),
  });
  renderReport(data, dryRun);
  if (!dryRun) {
    toast(`${data.summary.accepted} saved · ${data.summary.duplicates + data.summary.invalid} rejected`);
    refresh();
  } else {
    toast("Dry run complete — nothing stored");
  }
}

function formRecord() {
  const fd = new FormData($("#singleForm"));
  return Object.fromEntries(fd.entries());
}

$("#singleForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await send([formRecord()], false);
});
$("#checkBtn").addEventListener("click", () => send([formRecord()], true));

/* tabs */
document.querySelectorAll(".tab").forEach((t) =>
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    $("#singleForm").classList.toggle("active", t.dataset.tab === "single");
    $("#bulkPane").classList.toggle("active", t.dataset.tab === "bulk");
  }),
);

/* ---------- parsing ---------- */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const split = (line) => {
    const out = [];
    let cur = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === "," && !quoted) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((v) => v.trim());
  };
  const headers = split(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((l) => {
    const cells = split(l);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
  });
}

function parseInput(text) {
  const t = text.trim();
  if (!t) return [];
  if (t.startsWith("[") || t.startsWith("{")) {
    const parsed = JSON.parse(t);
    return Array.isArray(parsed) ? parsed : [parsed];
  }
  return parseCSV(t);
}

$("#bulkBtn").addEventListener("click", async () => {
  try {
    await send(parseInput($("#bulkText").value), false);
  } catch (err) {
    toast("Could not parse input: " + err.message);
  }
});

$("#sampleBtn").addEventListener("click", () => {
  $("#bulkText").value = `name,email,phone,city,age,department
Aarav Sharma,aarav@company.com,+919876543210,Bengaluru,29,Engineering
Priya Nair,priya.nair@company.com,+919812345678,Kochi,34,Design
aarav  sharma,AARAV@company.com,+919876543210,Bengaluru,29,Engineering
Rohit Verma,rohit.verma@company.com,+919900112233,Pune,41,Sales
Meera Iyer,not-an-email,+919000000001,Chennai,27,Finance
,missing.name@company.com,+919000000002,Delhi,31,Support
Priya Nair,p.riya.nair+work@company.com,+919812345678,Kochi,34,Design
Kabir Singh,kabir@company.com,12,Jaipur,205,Operations`;
  toast("Sample data loaded — includes duplicates and invalid rows");
});

/* file drop */
const drop = $("#drop"), fileInput = $("#fileInput");
$("#browse").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => readFile(e.target.files[0]));
["dragenter", "dragover"].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }),
);
["dragleave", "drop"].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }),
);
drop.addEventListener("drop", (e) => readFile(e.dataTransfer.files[0]));
function readFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { $("#bulkText").value = reader.result; toast(`Loaded ${file.name}`); };
  reader.readAsText(file);
}

/* reset */
$("#resetBtn").addEventListener("click", async () => {
  if (!confirm("Clear all stored records, stats and logs?")) return;
  await api("/api/reset", { method: "POST" });
  $("#report").className = "report empty";
  $("#report").innerHTML = "<p>Results of the validation → deduplication → storage pipeline appear here.</p>";
  $("#reportMeta").textContent = "Awaiting input";
  toast("Database cleared");
  refresh();
});

async function refresh() {
  await Promise.all([loadStats(), loadRecords(), loadLogs()]);
}
refresh();
setInterval(loadStats, 15000);
