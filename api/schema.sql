CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  cts INTEGER,
  uid TEXT NOT NULL,
  sid TEXT NOT NULL,
  persist INTEGER NOT NULL DEFAULT 0,
  material TEXT NOT NULL,
  v TEXT,
  country TEXT,
  type TEXT NOT NULL,
  round TEXT,
  mode TEXT,
  sec TEXT,
  item TEXT,
  resp TEXT,
  correct INTEGER,
  near INTEGER,
  try INTEGER,
  rt_ms INTEGER
);
CREATE INDEX IF NOT EXISTS ev_uid ON events(uid, ts);
CREATE INDEX IF NOT EXISTS ev_item ON events(material, item);
