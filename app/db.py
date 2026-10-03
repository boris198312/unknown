import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "dhikuti.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS circles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contribution REAL NOT NULL,
    months INTEGER NOT NULL,
    current_month INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open'
);
CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    circle_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    slot INTEGER,
    trust_score INTEGER NOT NULL DEFAULT 50
);
CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    circle_id INTEGER NOT NULL,
    member_id INTEGER,
    kind TEXT NOT NULL,
    amount REAL NOT NULL,
    month INTEGER NOT NULL,
    ts INTEGER NOT NULL,
    prev_hash TEXT NOT NULL,
    hash TEXT NOT NULL
);
"""


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
