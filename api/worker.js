// Worker zbierający anonimowe odpowiedzi z materiałów na vegesalmon.github.io/nauka.
// Wymaga powiązania D1 o nazwie DB (tabela z schema.sql). Opcjonalnie sekret EXPORT_KEY do pobierania danych.
//   POST /e        partia zdarzeń z track.js
//   GET  /health   {"ok":true}
//   GET  /export?key=EXPORT_KEY[&since=ID]   CSV wszystkich zdarzeń (po id > since)

const ALLOWED = [
  "https://vegesalmon.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];
const MAX_BODY = 32000;
const MAX_EVENTS = 100;
const TYPES = new Set(["answer", "reveal", "view", "round_start", "round_end"]);
const COLS = ["ts", "cts", "uid", "sid", "persist", "material", "v", "country", "type", "round",
  "mode", "sec", "item", "resp", "correct", "near", "try", "rt_ms"];

const str = (v, n) => (typeof v === "string" && v.length ? v.slice(0, n) : null);
const int = (v, lo, hi) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : null);
const bool = (v) => (v === true ? 1 : v === false ? 0 : null);

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

function csvCell(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";
    const h = corsHeaders(origin);

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });

    if (url.pathname === "/health") return Response.json({ ok: true }, { headers: h });

    if (url.pathname === "/e" && req.method === "POST") {
      if (!ALLOWED.includes(origin)) return new Response("forbidden origin", { status: 403, headers: h });
      const text = await req.text();
      if (text.length > MAX_BODY) return new Response("too large", { status: 413, headers: h });
      let body;
      try { body = JSON.parse(text); } catch { return new Response("bad json", { status: 400, headers: h }); }

      const uid = str(body.u, 40), sid = str(body.s, 40), material = str(body.m, 60);
      const events = Array.isArray(body.e) ? body.e.slice(0, MAX_EVENTS) : [];
      if (!uid || !sid || !material || !events.length) return new Response("missing fields", { status: 400, headers: h });

      const shared = {
        ts: Date.now(), uid, sid, persist: bool(body.p) ?? 0, material,
        v: str(body.v, 20), country: str(req.cf && req.cf.country, 2),
      };
      const stmt = env.DB.prepare(
        `INSERT INTO events (${COLS.join(",")}) VALUES (${COLS.map(() => "?").join(",")})`
      );
      const rows = [];
      for (const e of events) {
        if (!e || !TYPES.has(e.t)) continue;
        const row = {
          ...shared, cts: int(e.c, 0, 9e15), type: e.t, round: str(e.r, 40), mode: str(e.mo, 10),
          sec: str(e.se, 60), item: str(e.it, 60), resp: str(e.re, 60), correct: bool(e.ok),
          near: bool(e.nr), try: int(e.tr, 0, 99), rt_ms: int(e.rt, 0, 3600000),
        };
        rows.push(stmt.bind(...COLS.map((c) => row[c] ?? null)));
      }
      if (rows.length) await env.DB.batch(rows);
      return Response.json({ ok: true, n: rows.length }, { headers: h });
    }

    if (url.pathname === "/export" && req.method === "GET") {
      const key = url.searchParams.get("key") || (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!env.EXPORT_KEY || key !== env.EXPORT_KEY) return new Response("unauthorized", { status: 401, headers: h });
      const since = Number(url.searchParams.get("since") || 0) || 0;
      const { results } = await env.DB.prepare("SELECT * FROM events WHERE id > ? ORDER BY id LIMIT 100000").bind(since).all();
      const cols = ["id", ...COLS];
      const lines = [cols.join(",")].concat(results.map((r) => cols.map((c) => csvCell(r[c])).join(",")));
      return new Response(lines.join("\n") + "\n", {
        headers: { ...h, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="nauka-events.csv"' },
      });
    }

    return new Response("not found", { status: 404, headers: h });
  },
};
