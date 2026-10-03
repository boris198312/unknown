"""Stand-in for a licensed bank or wallet escrow account.
No real money moves. In production this module would call the partner's API."""
import uuid


def deposit(member_name: str, amount: float) -> dict:
    return {
        "tx_id": "MOCK-" + uuid.uuid4().hex[:8],
        "status": "held_in_escrow",
        "from": member_name,
        "amount": amount,
    }


def payout(member_name: str, amount: float) -> dict:
    return {
        "tx_id": "MOCK-" + uuid.uuid4().hex[:8],
        "status": "released",
        "to": member_name,
        "amount": amount,
    }
