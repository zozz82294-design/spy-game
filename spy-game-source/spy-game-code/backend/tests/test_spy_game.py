"""Backend tests for لعبة الجاسوس (Spy Game) - REST + WebSocket flows."""
import os
import json
import uuid
import asyncio
import pytest
import requests
import websockets
from pathlib import Path

# Load REACT_APP_BACKEND_URL from /app/frontend/.env
FRONTEND_ENV = Path("/app/frontend/.env")
BASE_URL = None
for line in FRONTEND_ENV.read_text().splitlines():
    if line.startswith("REACT_APP_BACKEND_URL="):
        BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
        break
assert BASE_URL, "REACT_APP_BACKEND_URL not found"

WS_BASE = BASE_URL.replace("https://", "wss://").replace("http://", "ws://")

API = f"{BASE_URL}/api"
WS_API = f"{WS_BASE}/api/ws"

DEFAULT_WAIT = 2.0


# ---------- Helpers ----------

async def recv_until(ws, predicate, timeout=3.0):
    """Receive messages until predicate(msg) is True, or timeout."""
    deadline = asyncio.get_event_loop().time() + timeout
    last = None
    while asyncio.get_event_loop().time() < deadline:
        remaining = deadline - asyncio.get_event_loop().time()
        if remaining <= 0:
            break
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=remaining)
        except asyncio.TimeoutError:
            break
        msg = json.loads(raw)
        last = msg
        if predicate(msg):
            return msg
    return last


async def recv_state(ws, timeout=3.0, where=None):
    """Receive next state message."""
    def is_state(m):
        return m.get("type") == "state"
    msg = await recv_until(ws, is_state, timeout=timeout)
    if not msg or msg.get("type") != "state":
        raise AssertionError(f"Expected state msg{' at '+where if where else ''}, got: {msg}")
    return msg["data"]


async def recv_latest_state(ws, settle=0.6):
    """Drain all messages and return the most recent state.data, or None."""
    last = None
    deadline = asyncio.get_event_loop().time() + settle
    while asyncio.get_event_loop().time() < deadline:
        remaining = max(0.05, deadline - asyncio.get_event_loop().time())
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=remaining)
        except asyncio.TimeoutError:
            break
        try:
            m = json.loads(raw)
        except Exception:
            continue
        if m.get("type") == "state":
            last = m["data"]
    return last


async def join_ws(room_id, player_id, name):
    """Open ws, send join, return websocket object."""
    ws = await websockets.connect(f"{WS_API}/{room_id}/{player_id}", open_timeout=10, close_timeout=2)
    await ws.send(json.dumps({"type": "join", "name": name}))
    return ws


async def drain(ws, timeout=0.5):
    """Drain any pending messages."""
    try:
        while True:
            await asyncio.wait_for(ws.recv(), timeout=timeout)
    except (asyncio.TimeoutError, Exception):
        pass


def create_room(host_name="SASUKE"):
    host_id = str(uuid.uuid4())
    last_err = None
    for _ in range(3):
        try:
            r = requests.post(f"{API}/rooms", json={"host_name": host_name, "player_id": host_id}, timeout=20)
            r.raise_for_status()
            body = r.json()
            return body["room_id"], host_id, body
        except Exception as e:
            last_err = e
    raise last_err


# ---------- REST tests ----------

class TestRoomsREST:
    def test_create_room(self):
        host_id = str(uuid.uuid4())
        r = requests.post(f"{API}/rooms", json={"host_name": "SASUKE", "player_id": host_id})
        assert r.status_code == 200
        data = r.json()
        assert "room_id" in data and len(data["room_id"]) == 6
        assert data["host_id"] == host_id

    def test_create_invalidates_previous(self):
        # Room A
        host_a = str(uuid.uuid4())
        rA = requests.post(f"{API}/rooms", json={"host_name": "SASUKE", "player_id": host_a}).json()
        room_a = rA["room_id"]
        # Verify A is active
        assert requests.get(f"{API}/rooms/{room_a}").status_code == 200
        # Create B
        host_b = str(uuid.uuid4())
        rB = requests.post(f"{API}/rooms", json={"host_name": "SASUKE", "player_id": host_b}).json()
        room_b = rB["room_id"]
        assert room_b != room_a
        # A should now be expired (410)
        assert requests.get(f"{API}/rooms/{room_a}").status_code == 410
        # B should be active
        assert requests.get(f"{API}/rooms/{room_b}").status_code == 200

    def test_get_room_returns_state(self):
        room_id, _, _ = create_room()
        r = requests.get(f"{API}/rooms/{room_id}")
        assert r.status_code == 200
        data = r.json()
        assert data["room_id"] == room_id
        assert data["state"] == "lobby"
        assert data["started"] is False
        assert data["player_count"] >= 1

    def test_get_unknown_room_410(self):
        r = requests.get(f"{API}/rooms/NOPE99")
        assert r.status_code == 410


# ---------- WebSocket tests ----------

@pytest.mark.asyncio
class TestWebSocketFlows:
    async def test_host_connect_initial_state(self):
        room_id, host_id, _ = create_room("SASUKE")
        ws = await join_ws(room_id, host_id, "SASUKE")
        try:
            state = await recv_state(ws, where="host initial")
            assert state["room_id"] == room_id
            assert state["host_id"] == host_id
            assert state["state"] == "lobby"
            # host should appear in players with is_host True
            host_entry = next((p for p in state["players"] if p["id"] == host_id), None)
            assert host_entry is not None
            assert host_entry["is_host"] is True
        finally:
            await ws.close()

    async def test_multiple_players_join(self):
        room_id, host_id, _ = create_room()
        host_ws = await join_ws(room_id, host_id, "SASUKE")
        await recv_state(host_ws)
        p1_id, p2_id = str(uuid.uuid4()), str(uuid.uuid4())
        p1 = await join_ws(room_id, p1_id, "Alice")
        p2 = await join_ws(room_id, p2_id, "Bob")
        try:
            # Drain & get latest host state
            await asyncio.sleep(0.5)
            await drain(host_ws, 0.3)
            # Trigger fresh state by reconnecting? Just check via REST
            r = requests.get(f"{API}/rooms/{room_id}").json()
            assert r["player_count"] == 3
        finally:
            for w in (host_ws, p1, p2):
                await w.close()

    async def test_duplicate_name_rejected(self):
        room_id, host_id, _ = create_room("SASUKE")
        host_ws = await join_ws(room_id, host_id, "SASUKE")
        await recv_state(host_ws)
        p1_id = str(uuid.uuid4())
        ws = await join_ws(room_id, p1_id, "SASUKE")  # duplicate
        try:
            msg = await asyncio.wait_for(ws.recv(), timeout=3.0)
            data = json.loads(msg)
            assert data.get("type") == "name_taken"
        finally:
            await ws.close()
            await host_ws.close()

    async def test_start_game_requires_3_players(self):
        room_id, host_id, _ = create_room()
        host_ws = await join_ws(room_id, host_id, "SASUKE")
        await recv_state(host_ws)
        # Only host - try start -> should stay in lobby
        await host_ws.send(json.dumps({"type": "start_game"}))
        await asyncio.sleep(0.3)
        await drain(host_ws, 0.3)
        r = requests.get(f"{API}/rooms/{room_id}").json()
        assert r["state"] == "lobby"
        await host_ws.close()

    async def test_full_game_flow(self):
        """End-to-end: create -> 3 players -> start -> category -> reveal -> vote -> spy_caught -> spy_guess -> finished -> restart."""
        room_id, host_id, _ = create_room("SASUKE")
        host_ws = await join_ws(room_id, host_id, "SASUKE")
        await recv_state(host_ws, where="host initial")
        p1_id, p2_id = str(uuid.uuid4()), str(uuid.uuid4())
        p1_ws = await join_ws(room_id, p1_id, "Alice")
        p2_ws = await join_ws(room_id, p2_id, "Bob")

        await asyncio.sleep(0.5)
        await drain(host_ws); await drain(p1_ws); await drain(p2_ws)

        # Start game
        await host_ws.send(json.dumps({"type": "start_game"}))
        state = await recv_state(host_ws, where="after start_game")
        assert state["state"] == "category"
        assert len(state["categories"]) >= 1
        category = state["categories"][0]

        # Drain extras
        await drain(p1_ws); await drain(p2_ws)

        # Select category
        await host_ws.send(json.dumps({"type": "select_category", "category": category}))
        # Get reveal state from each
        host_state = await recv_state(host_ws, where="reveal host")
        p1_state = await recv_state(p1_ws, where="reveal p1")
        p2_state = await recv_state(p2_ws, where="reveal p2")
        assert host_state["state"] == "reveal"
        assert host_state["category"] == category

        # Determine roles: spy should be one of non-host players
        roles = {host_id: host_state["role_for_viewer"], p1_id: p1_state["role_for_viewer"], p2_id: p2_state["role_for_viewer"]}
        words = {host_id: host_state["word_for_viewer"], p1_id: p1_state["word_for_viewer"], p2_id: p2_state["word_for_viewer"]}
        # Host is civilian
        assert roles[host_id] == "civilian"
        assert words[host_id] is not None
        # Exactly one spy among non-host
        non_host_roles = [roles[p1_id], roles[p2_id]]
        assert non_host_roles.count("spy") == 1
        spy_id = p1_id if roles[p1_id] == "spy" else p2_id
        non_spy_player_id = p2_id if spy_id == p1_id else p1_id
        spy_ws = p1_ws if spy_id == p1_id else p2_ws
        non_spy_ws = p2_ws if spy_id == p1_id else p1_ws
        # Spy has no word, civilians have word
        assert words[spy_id] is None
        assert words[non_spy_player_id] is not None
        the_word = words[host_id]

        # Start voting
        await host_ws.send(json.dumps({"type": "start_voting"}))
        s = await recv_state(host_ws, where="voting host")
        await drain(p1_ws); await drain(p2_ws)
        assert s["state"] == "voting"

        # All three vote for the spy
        for voter_ws in (host_ws, spy_ws, non_spy_ws):
            await voter_ws.send(json.dumps({"type": "vote", "target_id": spy_id}))
            await asyncio.sleep(0.15)

        # Allow broadcasts to settle
        await asyncio.sleep(0.6)
        # Drain to most recent on host
        last = None
        try:
            while True:
                raw = await asyncio.wait_for(host_ws.recv(), timeout=0.4)
                m = json.loads(raw)
                if m.get("type") == "state":
                    last = m["data"]
        except asyncio.TimeoutError:
            pass
        assert last is not None
        assert last["state"] == "spy_caught", f"expected spy_caught, got {last['state']}"
        assert last["spy_caught"] is True
        assert len(last["vote_log"]) == 3

        # Spy receives spy_guess_options when state moves to spy_guess
        # Drain spy_ws to latest state first (should be spy_caught)
        await recv_latest_state(spy_ws, settle=0.5)
        await spy_ws.send(json.dumps({"type": "spy_guess_phase"}))
        spy_state = await recv_latest_state(spy_ws, settle=0.8)
        assert spy_state is not None
        assert spy_state["state"] == "spy_guess", f"expected spy_guess, got {spy_state['state']}"
        assert len(spy_state["spy_guess_options"]) == 30
        assert the_word in spy_state["spy_guess_options"]

        # Spy submits a guess
        await spy_ws.send(json.dumps({"type": "spy_guess", "guess": the_word}))
        host_final = await recv_state(host_ws, where="finished host")
        # may need to drain to latest
        try:
            while True:
                raw = await asyncio.wait_for(host_ws.recv(), timeout=0.4)
                m = json.loads(raw)
                if m.get("type") == "state":
                    host_final = m["data"]
        except asyncio.TimeoutError:
            pass
        assert host_final["state"] == "finished"
        assert host_final["spy_final_guess"] == the_word

        # Restart
        await host_ws.send(json.dumps({"type": "restart_game"}))
        await asyncio.sleep(0.3)
        s = await recv_state(host_ws, where="restart")
        try:
            while True:
                raw = await asyncio.wait_for(host_ws.recv(), timeout=0.3)
                m = json.loads(raw)
                if m.get("type") == "state":
                    s = m["data"]
        except asyncio.TimeoutError:
            pass
        assert s["state"] == "lobby"

        for w in (host_ws, p1_ws, p2_ws):
            await w.close()

    async def test_late_joiner_gets_game_started(self):
        room_id, host_id, _ = create_room()
        host_ws = await join_ws(room_id, host_id, "SASUKE")
        await recv_state(host_ws)
        p1_id, p2_id = str(uuid.uuid4()), str(uuid.uuid4())
        p1_ws = await join_ws(room_id, p1_id, "Alice")
        p2_ws = await join_ws(room_id, p2_id, "Bob")
        await asyncio.sleep(0.3)
        await drain(host_ws); await drain(p1_ws); await drain(p2_ws)
        await host_ws.send(json.dumps({"type": "start_game"}))
        await asyncio.sleep(0.4)
        # Late joiner
        late_id = str(uuid.uuid4())
        late_ws = await join_ws(room_id, late_id, "LateGuy")
        try:
            msg = await asyncio.wait_for(late_ws.recv(), timeout=3.0)
            data = json.loads(msg)
            assert data.get("type") == "game_started"
        finally:
            await late_ws.close()
            for w in (host_ws, p1_ws, p2_ws):
                await w.close()

    async def test_kick_player(self):
        room_id, host_id, _ = create_room()
        host_ws = await join_ws(room_id, host_id, "SASUKE")
        await recv_state(host_ws)
        p1_id, p2_id = str(uuid.uuid4()), str(uuid.uuid4())
        p1_ws = await join_ws(room_id, p1_id, "Alice")
        p2_ws = await join_ws(room_id, p2_id, "Bob")
        await asyncio.sleep(0.3)
        await drain(host_ws); await drain(p1_ws); await drain(p2_ws)
        # Host kicks Alice
        await host_ws.send(json.dumps({"type": "kick", "target_id": p1_id}))
        # Alice should receive kicked message
        got_kicked = False
        try:
            for _ in range(5):
                raw = await asyncio.wait_for(p1_ws.recv(), timeout=2.0)
                m = json.loads(raw)
                if m.get("type") == "kicked":
                    got_kicked = True
                    break
        except (asyncio.TimeoutError, Exception):
            pass
        assert got_kicked, "Alice did not receive kicked event"
        await asyncio.sleep(0.3)
        r = requests.get(f"{API}/rooms/{room_id}").json()
        assert r["player_count"] == 2
        await host_ws.close(); await p2_ws.close()
        try: await p1_ws.close()
        except Exception: pass

    async def test_player_leave(self):
        room_id, host_id, _ = create_room()
        host_ws = await join_ws(room_id, host_id, "SASUKE")
        await recv_state(host_ws)
        p1_id = str(uuid.uuid4())
        p1_ws = await join_ws(room_id, p1_id, "Alice")
        await asyncio.sleep(0.3)
        await drain(host_ws); await drain(p1_ws)
        await p1_ws.send(json.dumps({"type": "leave"}))
        await asyncio.sleep(0.4)
        r = requests.get(f"{API}/rooms/{room_id}").json()
        assert r["player_count"] == 1
        await host_ws.close()
        try: await p1_ws.close()
        except Exception: pass

    async def test_host_leave_clears_room(self):
        room_id, host_id, _ = create_room()
        host_ws = await join_ws(room_id, host_id, "SASUKE")
        await recv_state(host_ws)
        p1_id = str(uuid.uuid4())
        p1_ws = await join_ws(room_id, p1_id, "Alice")
        await asyncio.sleep(0.3)
        await drain(host_ws); await drain(p1_ws)
        await host_ws.send(json.dumps({"type": "leave"}))
        # p1 should receive host_left
        got = False
        try:
            for _ in range(5):
                raw = await asyncio.wait_for(p1_ws.recv(), timeout=2.0)
                m = json.loads(raw)
                if m.get("type") == "host_left":
                    got = True
                    break
        except (asyncio.TimeoutError, Exception):
            pass
        assert got, "p1 did not receive host_left event"
        # Room cleared
        await asyncio.sleep(0.3)
        r = requests.get(f"{API}/rooms/{room_id}")
        assert r.status_code == 410
        try: await host_ws.close()
        except Exception: pass
        try: await p1_ws.close()
        except Exception: pass
