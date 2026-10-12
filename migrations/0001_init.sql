-- Free Cloudflare D1. Everything stored here is ciphertext (or a salted hash of an address). Nothing is readable without a key we never see.
CREATE TABLE IF NOT EXISTS witness (token TEXT PRIMARY KEY, c TEXT NOT NULL, ip_hash TEXT, at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS go_event (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL, c TEXT NOT NULL, ip_hash TEXT, at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS go_event_token ON go_event (token);
CREATE TABLE IF NOT EXISTS vault (id TEXT PRIMARY KEY, secret_hash TEXT NOT NULL, meta TEXT NOT NULL, blob TEXT NOT NULL, at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rl (k TEXT PRIMARY KEY, n INTEGER NOT NULL, win INTEGER NOT NULL);
