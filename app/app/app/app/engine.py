from . import escrow_mock
from .ledger import add_entry

POOL_FEE_RATE = 0.02   # 2% of each contribution goes to the guarantee pool
TRUST_PENALTY = 20
TRUST_REWARD = 5


def _circle(conn, circle_id):
    row = conn.execute("SELECT * FROM circles WHERE id=?", (circle_id,)).fetchone()
    if not row:
        raise ValueError("Circle not found")
    return row


def _member_name(conn, member_id):
    row = conn.execute(
        "SELECT u.name FROM members m JOIN users u ON u.id=m.user_id WHERE m.id=?",
        (member_id,),
    ).fetchone()
    return row["name"] if row else "unknown"


def pool_balance(conn, circle_id) -> float:
    row = conn.execute(
        """SELECT COALESCE(SUM(CASE kind
                 WHEN 'pool_fee' THEN amount
                 WHEN 'pool_seed' THEN amount
                 WHEN 'pool_cover' THEN -amount
                 ELSE 0 END), 0) AS bal
           FROM ledger WHERE circle_id=?""",
        (circle_id,),
    ).fetchone()
    return round(row["bal"], 2)


def join_circle(conn, circle_id, name):
    circle = _circle(conn, circle_id)
    if circle["status"] != "open":
        raise ValueError("Circle already started")
    count = conn.execute(
        "SELECT COUNT(*) AS c FROM members WHERE circle_id=?", (circle_id,)
    ).fetchone()["c"]
    if count >= circle["months"]:
        raise ValueError("Circle is full")
    cur = conn.execute("INSERT INTO users (name) VALUES (?)", (name,))
    cur2 = conn.execute(
        "INSERT INTO members (circle_id, user_id) VALUES (?,?)",
        (circle_id, cur.lastrowid),
    )
    conn.commit()
    return cur2.lastrowid


def start_circle(conn, circle_id):
    circle = _circle(conn, circle_id)
    members = conn.execute(
        "SELECT * FROM members WHERE circle_id=?", (circle_id,)
    ).fetchall()
    if circle["status"] != "open":
        raise ValueError("Circle already started")
    if len(members) != circle["months"]:
        raise ValueError(f"Need exactly {circle['months']} members, have {len(members)}")
    # Higher trust gets an earlier slot; new or risky members are paid later.
    ordered = sorted(members, key=lambda m: m["trust_score"], reverse=True)
    for slot, m in enumerate(ordered, start=1):
        conn.execute("UPDATE members SET slot=? WHERE id=?", (slot, m["id"]))
    conn.execute(
        "UPDATE circles SET status='active', current_month=1 WHERE id=?", (circle_id,)
    )
    conn.commit()


def seed_pool(conn, circle_id, amount):
    circle = _circle(conn, circle_id)
    add_entry(conn, circle_id, None, "pool_seed", amount, max(circle["current_month"], 0))


def record_contribution(conn, circle_id, member_id):
    circle = _circle(conn, circle_id)
    if circle["status"] != "active":
        raise ValueError("Circle is not active")
    member = conn.execute(
        "SELECT * FROM members WHERE id=? AND circle_id=?", (member_id, circle_id)
    ).fetchone()
    if not member:
        raise ValueError("Member not in this circle")
    month = circle["current_month"]
    already = conn.execute(
        "SELECT 1 FROM ledger WHERE circle_id=? AND member_id=? AND kind='contribution' AND month=?",
        (circle_id, member_id, month),
    ).fetchone()
    if already:
        raise ValueError("Already paid this month")
    amount = circle["contribution"]
    tx = escrow_mock.deposit(_member_name(conn, member_id), amount)
    add_entry(conn, circle_id, member_id, "contribution", amount, month)
    add_entry(conn, circle_id, member_id, "pool_fee", amount * POOL_FEE_RATE, month)
    return tx


def advance_month(conn, circle_id):
    circle = _circle(conn, circle_id)
    if circle["status"] != "active":
        raise ValueError("Circle is not active")
    month = circle["current_month"]
    members = conn.execute(
        "SELECT * FROM members WHERE circle_id=?", (circle_id,)
    ).fetchall()
    paid = {
        r["member_id"]
        for r in conn.execute(
            "SELECT member_id FROM ledger WHERE circle_id=? AND kind='contribution' AND month=?",
            (circle_id, month),
        )
    }
    collected = len(paid) * circle["contribution"]
    pot = circle["contribution"] * len(members)

    missed_names = []
    for m in members:
        if m["id"] in paid:
            new_score = min(100, m["trust_score"] + TRUST_REWARD)
        else:
            new_score = max(0, m["trust_score"] - TRUST_PENALTY)
            add_entry(conn, circle_id, m["id"], "missed", circle["contribution"], month)
            missed_names.append(_member_name(conn, m["id"]))
        conn.execute("UPDATE members SET trust_score=? WHERE id=?", (new_score, m["id"]))

    shortfall = max(0.0, pot - collected)
    cover = min(shortfall, pool_balance(conn, circle_id))
    if cover > 0:
        add_entry(conn, circle_id, None, "pool_cover", cover, month)

    recipient = next(m for m in members if m["slot"] == month)
    payout_amount = collected + cover
    tx = escrow_mock.payout(_member_name(conn, recipient["id"]), payout_amount)
    add_entry(conn, circle_id, recipient["id"], "payout", payout_amount, month)

    next_month = month + 1
    status = "complete" if next_month > circle["months"] else "active"
    conn.execute(
        "UPDATE circles SET current_month=?, status=? WHERE id=?",
        (next_month, status, circle_id),
    )
    conn.commit()
    return {
        "month": month,
        "recipient": _member_name(conn, recipient["id"]),
        "payout": payout_amount,
        "missed": missed_names,
        "covered_by_pool": cover,
        "uncovered_shortfall": round(shortfall - cover, 2),
        "tx": tx,
        "status": status,
    }


def passport(conn, member_id):
    m = conn.execute(
        "SELECT m.*, u.name FROM members m JOIN users u ON u.id=m.user_id WHERE m.id=?",
        (member_id,),
    ).fetchone()
    if not m:
        raise ValueError("Member not found")
    counts = {
        r["kind"]: r["c"]
        for r in conn.execute(
            "SELECT kind, COUNT(*) AS c FROM ledger WHERE member_id=? GROUP BY kind",
            (member_id,),
        )
    }
    on_time = counts.get("contribution", 0)
    missed = counts.get("missed", 0)
    score = m["trust_score"]
    band = "Strong" if score >= 80 else "Fair" if score >= 50 else "Low"
    return {
        "name": m["name"],
        "payments_on_time": on_time,
        "payments_missed": missed,
        "trust_score": score,
        "band": band,
        "note": "Prototype score from circle history only. Not a bank-approved credit score.",
    }
