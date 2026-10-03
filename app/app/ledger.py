import hashlib
import json
import time


def _digest(body: dict) -> str:
    return hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()


def add_entry(conn, circle_id, member_id, kind, amount, month):
    """Append one entry. Each entry stores the hash of the previous one."""
    last = conn.execute(
        "SELECT hash FROM ledger WHERE circle_id=? ORDER BY id DESC LIMIT 1",
        (circle_id,),
    ).fetchone()
    prev = last["hash"] if last else "GENESIS"
    ts = int(time.time() * 1000)
    amount = round(float(amount), 2)
    body = {
        "circle": circle_id,
        "member": member_id,
        "kind": kind,
        "amount": amount,
        "month": month,
        "ts": ts,
        "prev": prev,
    }
    h = _digest(body)
    conn.execute(
        "INSERT INTO ledger (circle_id, member_id, kind, amount, month, ts, prev_hash, hash) "
        "VALUES (?,?,?,?,?,?,?,?)",
        (circle_id, member_id, kind, amount, month, ts, prev, h),
    )
    conn.commit()
    return h


def verify_chain(conn, circle_id):
    """Recompute every hash. Returns (is_valid, id_of_first_bad_entry)."""
    rows = conn.execute(
        "SELECT * FROM ledger WHERE circle_id=? ORDER BY id", (circle_id,)
    ).fetchall()
    prev = "GENESIS"
    for r in rows:
        body = {
            "circle": r["circle_id"],
            "member": r["member_id"],
            "kind": r["kind"],
            "amount": r["amount"],
            "month": r["month"],
            "ts": r["ts"],
            "prev": prev,
        }
        if r["prev_hash"] != prev or r["hash"] != _digest(body):
            return False, r["id"]
        prev = r["hash"]
    return True, None
