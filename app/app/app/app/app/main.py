from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import engine
from .db import get_db, init_db
from .ledger import verify_chain

init_db()
app = FastAPI(title="Digital Dhikuti")


class CircleIn(BaseModel):
    name: str
    contribution: float = Field(gt=0)
    months: int = Field(ge=2, le=24)


class JoinIn(BaseModel):
    name: str


class ContributeIn(BaseModel):
    member_id: int


class SeedIn(BaseModel):
    amount: float = Field(gt=0)


def guarded(fn, *args):
    try:
        return fn(*args)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


def get_circle(conn, circle_id):
    row = conn.execute("SELECT * FROM circles WHERE id=?", (circle_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Circle not found")
    return row


@app.post("/circles")
def create_circle(body: CircleIn, conn=Depends(get_db)):
    cur = conn.execute(
        "INSERT INTO circles (name, contribution, months) VALUES (?,?,?)",
        (body.name, body.contribution, body.months),
    )
    conn.commit()
    return {"id": cur.lastrowid}


@app.post("/circles/{circle_id}/join")
def join(circle_id: int, body: JoinIn, conn=Depends(get_db)):
    member_id = guarded(engine.join_circle, conn, circle_id, body.name)
    return {"member_id": member_id}


@app.post("/circles/{circle_id}/start")
def start(circle_id: int, conn=Depends(get_db)):
    guarded(engine.start_circle, conn, circle_id)
    return {"ok": True}


@app.post("/circles/{circle_id}/seed-pool")
def seed(circle_id: int, body: SeedIn, conn=Depends(get_db)):
    get_circle(conn, circle_id)
    guarded(engine.seed_pool, conn, circle_id, body.amount)
    return {"ok": True}


@app.post("/circles/{circle_id}/contribute")
def contribute(circle_id: int, body: ContributeIn, conn=Depends(get_db)):
    return guarded(engine.record_contribution, conn, circle_id, body.member_id)


@app.post("/circles/{circle_id}/advance")
def advance(circle_id: int, conn=Depends(get_db)):
    return guarded(engine.advance_month, conn, circle_id)


@app.get("/circles/{circle_id}")
def circle_state(circle_id: int, conn=Depends(get_db)):
    circle = dict(get_circle(conn, circle_id))
    members = [
        dict(r)
        for r in conn.execute(
            "SELECT m.id, u.name, m.slot, m.trust_score FROM members m "
            "JOIN users u ON u.id=m.user_id WHERE m.circle_id=? "
            "ORDER BY COALESCE(m.slot, m.id)",
            (circle_id,),
        )
    ]
    return {
        "circle": circle,
        "members": members,
        "pool_balance": engine.pool_balance(conn, circle_id),
    }


@app.get("/circles/{circle_id}/ledger")
def ledger(circle_id: int, conn=Depends(get_db)):
    get_circle(conn, circle_id)
    rows = conn.execute(
        "SELECT l.id, l.month, l.kind, l.amount, u.name AS member_name, l.hash "
        "FROM ledger l LEFT JOIN members m ON m.id=l.member_id "
        "LEFT JOIN users u ON u.id=m.user_id "
        "WHERE l.circle_id=? ORDER BY l.id",
        (circle_id,),
    ).fetchall()
    return [dict(r) for r in rows]


@app.get("/circles/{circle_id}/verify")
def verify(circle_id: int, conn=Depends(get_db)):
    get_circle(conn, circle_id)
    ok, bad_id = verify_chain(conn, circle_id)
    return {"valid": ok, "first_bad_entry": bad_id}


@app.get("/members/{member_id}/passport")
def member_passport(member_id: int, conn=Depends(get_db)):
    return guarded(engine.passport, conn, member_id)


@app.post("/demo/tamper/{entry_id}")
def demo_tamper(entry_id: int, conn=Depends(get_db)):
    """Demo only: edits a ledger row directly so you can show verification failing."""
    conn.execute("UPDATE ledger SET amount = amount + 500 WHERE id=?", (entry_id,))
    conn.commit()
    return {"tampered": entry_id}


STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
