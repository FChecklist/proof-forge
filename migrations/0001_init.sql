-- Free Cloudflare D1. Two append-style tables; nothing here is readable without the capability token or the vault key.
CREATE TABLE IF NOT EXISTS witness (token TEXT PRIMARY KEY, rec TEXT NOT NULL, ip_hash TEXT, at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS vault (id TEXT PRIMARY KEY, secret_hash TEXT NOT NULL, meta TEXT NOT NULL, blob TEXT NOT NULL, at INTEGER NOT NULL);
