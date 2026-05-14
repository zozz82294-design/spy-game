"""لعبة الجاسوس - Spy Game Backend
FastAPI + WebSocket for real-time multiplayer.
"""
from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
import os
import random
import string
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Optional, Set
from datetime import datetime, timezone

from words import CATEGORIES

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Game State (in-memory) ----------
# Single active room model: only one room is "live" at a time.
# When a new room is created, the previous active room becomes invalid.

class Player:
    def __init__(self, player_id: str, name: str, is_host: bool = False):
        self.id = player_id
        self.name = name
        self.is_host = is_host
        self.connected = False
        self.role: Optional[str] = None  # 'civilian' | 'spy'
        self.has_voted = False
        self.voted_for: Optional[str] = None  # player_id
        self.disconnect_task: Optional[asyncio.Task] = None  # grace-period removal task

    def to_dict(self, include_role: bool = False):
        data = {
            "id": self.id,
            "name": self.name,
            "is_host": self.is_host,
            "connected": self.connected,
            "has_voted": self.has_voted,
        }
        if include_role:
            data["role"] = self.role
        return data


class Room:
    def __init__(self, room_id: str, host_id: str, host_name: str = "SASUKE"):
        self.id = room_id
        self.host_id = host_id
        self.players: Dict[str, Player] = {}
        self.players[host_id] = Player(host_id, host_name, is_host=True)
        self.state = "lobby"  # lobby | category | reveal | voting | spy_caught | spy_guess | finished
        self.category: Optional[str] = None
        self.word: Optional[str] = None
        self.spy_id: Optional[str] = None
        self.vote_log: List[dict] = []  # [{voter_name, voted_name}]
        self.vote_results: Dict[str, int] = {}  # player_id -> count
        self.most_voted_id: Optional[str] = None
        self.spy_guess_options: List[str] = []
        self.spy_final_guess: Optional[str] = None
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.connections: Dict[str, Set[WebSocket]] = {}  # player_id -> sockets
        self.kicked_ids: Set[str] = set()

    def add_player(self, player_id: str, name: str) -> Player:
        p = Player(player_id, name)
        self.players[player_id] = p
        return p

    def remove_player(self, player_id: str):
        if player_id in self.players:
            p = self.players[player_id]
            if p.disconnect_task and not p.disconnect_task.done():
                p.disconnect_task.cancel()
            del self.players[player_id]
        if player_id in self.connections:
            del self.connections[player_id]

    def has_name(self, name: str, exclude_id: Optional[str] = None) -> bool:
        for pid, p in self.players.items():
            if pid != exclude_id and p.name.strip().lower() == name.strip().lower():
                return True
        return False

    def ordered_players(self) -> List[Player]:
        host = self.players.get(self.host_id)
        others = [p for pid, p in self.players.items() if pid != self.host_id]
        result = []
        if host:
            result.append(host)
        result.extend(others)
        return result

    def public_state(self, for_player_id: Optional[str] = None) -> dict:
        viewer = self.players.get(for_player_id) if for_player_id else None
        players_view = []
        for p in self.ordered_players():
            players_view.append(p.to_dict())

        # Word reveal logic
        word_for_viewer = None
        role_for_viewer = None
        if viewer and self.state in ("reveal", "voting", "spy_caught", "spy_guess", "finished"):
            role_for_viewer = viewer.role
            if viewer.role == "civilian":
                word_for_viewer = self.word
            else:
                word_for_viewer = None  # spy doesn't see word

        spy_name = None
        if self.state in ("spy_caught", "spy_guess", "finished") and self.spy_id:
            sp = self.players.get(self.spy_id)
            spy_name = sp.name if sp else None

        most_voted_name = None
        if self.most_voted_id:
            mv = self.players.get(self.most_voted_id)
            most_voted_name = mv.name if mv else None

        return {
            "room_id": self.id,
            "host_id": self.host_id,
            "host_name": self.players[self.host_id].name if self.host_id in self.players else "SASUKE",
            "state": self.state,
            "players": players_view,
            "category": self.category,
            "word_for_viewer": word_for_viewer,
            "role_for_viewer": role_for_viewer,
            "vote_count": sum(1 for p in self.players.values() if p.has_voted),
            "total_voters": len(self.players),
            "vote_log": self.vote_log,
            "spy_name": spy_name,
            "most_voted_name": most_voted_name,
            "most_voted_id": self.most_voted_id,
            "spy_caught": (self.most_voted_id == self.spy_id) if self.most_voted_id else None,
            "spy_guess_options": self.spy_guess_options if for_player_id == self.spy_id and self.state == "spy_guess" else [],
            "spy_final_guess": self.spy_final_guess,
            "can_start": len(self.players) >= 3 and self.state == "lobby",
            "categories": list(CATEGORIES.keys()) if self.state == "category" else [],
        }


# Global single-active-room
ACTIVE_ROOM: Optional[Room] = None
LOCK = asyncio.Lock()


def gen_room_id() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


async def broadcast(room: Room):
    """Send personalized state to every connected player."""
    to_remove = []
    for pid, sockets in list(room.connections.items()):
        state = room.public_state(for_player_id=pid)
        msg = {"type": "state", "data": state}
        dead = set()
        for ws in list(sockets):
            try:
                await ws.send_json(msg)
            except Exception:
                dead.add(ws)
        for ws in dead:
            sockets.discard(ws)
        if not sockets:
            to_remove.append(pid)


async def send_to_player(room: Room, player_id: str, message: dict):
    sockets = room.connections.get(player_id, set())
    for ws in list(sockets):
        try:
            await ws.send_json(message)
        except Exception:
            pass


# ---------- REST Endpoints ----------

class CreateRoomReq(BaseModel):
    host_name: Optional[str] = "SASUKE"
    player_id: str


@api_router.post("/rooms")
async def create_room(req: CreateRoomReq):
    """Create a new room. Invalidates any previous active room."""
    global ACTIVE_ROOM
    async with LOCK:
        # Invalidate old room
        if ACTIVE_ROOM is not None:
            old = ACTIVE_ROOM
            # Notify all connections that room expired
            for pid, sockets in list(old.connections.items()):
                for ws in list(sockets):
                    try:
                        await ws.send_json({"type": "expired"})
                        await ws.close()
                    except Exception:
                        pass
            old.connections.clear()

        room_id = gen_room_id()
        host_name = (req.host_name or "SASUKE").strip() or "SASUKE"
        ACTIVE_ROOM = Room(room_id=room_id, host_id=req.player_id, host_name=host_name)
        logger.info(f"Created room {room_id} for host {req.player_id} ({host_name})")
        return {"room_id": room_id, "host_id": req.player_id}


@api_router.get("/rooms/{room_id}")
async def get_room(room_id: str):
    """Check if a room is valid. Used to validate link before joining."""
    global ACTIVE_ROOM
    if ACTIVE_ROOM is None or ACTIVE_ROOM.id != room_id:
        raise HTTPException(status_code=410, detail="انتهت صلاحية الرابط")
    return {
        "room_id": ACTIVE_ROOM.id,
        "state": ACTIVE_ROOM.state,
        "player_count": len(ACTIVE_ROOM.players),
        "started": ACTIVE_ROOM.state != "lobby",
    }


@api_router.get("/")
async def root():
    return {"message": "Spy Game API", "active_room": ACTIVE_ROOM.id if ACTIVE_ROOM else None}


# ---------- WebSocket ----------

@app.websocket("/api/ws/{room_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_id: str):
    await websocket.accept()
    global ACTIVE_ROOM

    # Validate room
    if ACTIVE_ROOM is None or ACTIVE_ROOM.id != room_id:
        await websocket.send_json({"type": "expired"})
        await websocket.close()
        return

    room = ACTIVE_ROOM

    if player_id in room.kicked_ids:
        await websocket.send_json({"type": "kicked"})
        await websocket.close()
        return

    # Wait for join message with name
    try:
        first_msg = await asyncio.wait_for(websocket.receive_json(), timeout=10.0)
    except Exception:
        await websocket.close()
        return

    if first_msg.get("type") != "join":
        await websocket.close()
        return

    name = (first_msg.get("name") or "").strip()

    async with LOCK:
        # Re-check room is still valid
        if ACTIVE_ROOM is None or ACTIVE_ROOM.id != room_id:
            await websocket.send_json({"type": "expired"})
            await websocket.close()
            return

        existing = room.players.get(player_id)
        if existing is None:
            # New player joining
            if room.state != "lobby":
                await websocket.send_json({"type": "game_started"})
                await websocket.close()
                return
            if not name:
                await websocket.send_json({"type": "error", "message": "الاسم مطلوب"})
                await websocket.close()
                return
            if room.has_name(name):
                await websocket.send_json({"type": "name_taken"})
                await websocket.close()
                return
            room.add_player(player_id, name)
            existing = room.players[player_id]
        else:
            # Reconnect - keep existing name. If name was provided and different, allow if not taken
            if name and name != existing.name and not room.has_name(name, exclude_id=player_id):
                existing.name = name

        existing.connected = True
        # If a previous disconnect-grace task is pending, cancel it (player came back in time)
        if existing.disconnect_task and not existing.disconnect_task.done():
            existing.disconnect_task.cancel()
            existing.disconnect_task = None
        room.connections.setdefault(player_id, set()).add(websocket)

    await broadcast(room)

    try:
        while True:
            msg = await websocket.receive_json()
            await handle_message(room, player_id, msg)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.exception(f"WS error: {e}")
    finally:
        # Cleanup connection. Keep player in room briefly (grace period) to allow refresh.
        # If they don't reconnect within GRACE seconds, remove them so their name disappears.
        async with LOCK:
            if room is ACTIVE_ROOM:
                sockets = room.connections.get(player_id, set())
                sockets.discard(websocket)
                if not sockets:
                    room.connections.pop(player_id, None)
                    p = room.players.get(player_id)
                    if p:
                        p.connected = False
                        # Cancel any prior task and schedule a fresh grace removal
                        if p.disconnect_task and not p.disconnect_task.done():
                            p.disconnect_task.cancel()
                        p.disconnect_task = asyncio.create_task(_grace_remove(room, player_id))
        try:
            await broadcast(room)
        except Exception:
            pass


# Grace period before removing a disconnected player. Allows refresh/network blips.
GRACE_SECONDS = 8

async def _grace_remove(room: "Room", player_id: str):
    """Remove player after GRACE_SECONDS if they haven't reconnected."""
    try:
        await asyncio.sleep(GRACE_SECONDS)
    except asyncio.CancelledError:
        return
    global ACTIVE_ROOM
    async with LOCK:
        if room is not ACTIVE_ROOM:
            return
        p = room.players.get(player_id)
        if not p:
            return
        # Reconnected during sleep? abort
        if p.connected or room.connections.get(player_id):
            return
        await _player_exit(room, player_id, kicked=False)
    try:
        await broadcast(room)
    except Exception:
        pass


async def handle_message(room: Room, player_id: str, msg: dict):
    global ACTIVE_ROOM
    if room is not ACTIVE_ROOM:
        return
    mtype = msg.get("type")
    player = room.players.get(player_id)
    if not player:
        return
    is_host = player.is_host

    if mtype == "leave":
        # Player chooses to leave
        async with LOCK:
            await _player_exit(room, player_id, kicked=False)
        await broadcast(room)

    elif mtype == "kick" and is_host:
        target_id = msg.get("target_id")
        if target_id and target_id in room.players and target_id != room.host_id:
            async with LOCK:
                room.kicked_ids.add(target_id)
                # Notify kicked player
                await send_to_player(room, target_id, {"type": "kicked"})
                # Close their sockets
                for ws in list(room.connections.get(target_id, set())):
                    try:
                        await ws.close()
                    except Exception:
                        pass
                await _player_exit(room, target_id, kicked=True)
            await broadcast(room)

    elif mtype == "start_game" and is_host:
        async with LOCK:
            if room.state == "lobby" and len(room.players) >= 3:
                room.state = "category"
        await broadcast(room)

    elif mtype == "select_category" and is_host:
        cat = msg.get("category")
        if cat in CATEGORIES and room.state == "category":
            async with LOCK:
                room.category = cat
                room.word = random.choice(CATEGORIES[cat])
                # Pick spy from non-host players
                candidates = [pid for pid in room.players if pid != room.host_id]
                if candidates:
                    room.spy_id = random.choice(candidates)
                    for pid, p in room.players.items():
                        p.role = "spy" if pid == room.spy_id else "civilian"
                        p.has_voted = False
                        p.voted_for = None
                    room.vote_log = []
                    room.vote_results = {}
                    room.most_voted_id = None
                    room.state = "reveal"
        await broadcast(room)

    elif mtype == "start_voting" and is_host:
        async with LOCK:
            if room.state == "reveal":
                room.state = "voting"
                for p in room.players.values():
                    p.has_voted = False
                    p.voted_for = None
                room.vote_log = []
                room.vote_results = {}
        await broadcast(room)

    elif mtype == "vote":
        target_id = msg.get("target_id")
        if room.state == "voting" and target_id in room.players and not player.has_voted:
            async with LOCK:
                player.has_voted = True
                player.voted_for = target_id
                target = room.players[target_id]
                room.vote_log.append({"voter": player.name, "voted": target.name})
                room.vote_results[target_id] = room.vote_results.get(target_id, 0) + 1
                await _check_voting_complete(room)
        await broadcast(room)

    elif mtype == "spy_guess_phase":
        # Spy moves from spy_caught -> spy_guess
        if room.state == "spy_caught" and player_id == room.spy_id:
            async with LOCK:
                room.state = "spy_guess"
        await broadcast(room)

    elif mtype == "spy_guess":
        if room.state == "spy_guess" and player_id == room.spy_id:
            guess = msg.get("guess")
            if guess:
                async with LOCK:
                    room.spy_final_guess = guess
                    room.state = "finished"
        await broadcast(room)

    elif mtype == "restart_game" and is_host:
        async with LOCK:
            room.state = "lobby"
            room.category = None
            room.word = None
            room.spy_id = None
            room.vote_log = []
            room.vote_results = {}
            room.most_voted_id = None
            room.spy_guess_options = []
            room.spy_final_guess = None
            for p in room.players.values():
                p.role = None
                p.has_voted = False
                p.voted_for = None
        await broadcast(room)


async def _check_voting_complete(room: Room):
    """Check if all connected players have voted. If yes, move to next state."""
    total = len(room.players)
    voted = sum(1 for p in room.players.values() if p.has_voted)
    if voted >= total and total > 0:
        # Tally
        if room.vote_results:
            max_count = max(room.vote_results.values())
            top = [pid for pid, c in room.vote_results.items() if c == max_count]
            room.most_voted_id = random.choice(top)
        else:
            room.most_voted_id = None
        # Move to spy_caught state with spy options ready
        spy_caught = (room.most_voted_id == room.spy_id)
        # Always allow spy to attempt guess (whether caught or escaped)
        cat_words = CATEGORIES.get(room.category, [])
        options = [room.word] if room.word else []
        pool = [w for w in cat_words if w != room.word]
        random.shuffle(pool)
        options.extend(pool[:29])
        random.shuffle(options)
        room.spy_guess_options = options
        room.state = "spy_caught"


async def _player_exit(room: Room, player_id: str, kicked: bool):
    """Remove a player and handle game-state implications."""
    if player_id not in room.players:
        return
    was_voter = room.players[player_id].has_voted
    voted_for = room.players[player_id].voted_for
    is_host = room.players[player_id].is_host

    room.remove_player(player_id)

    # If host leaves, room is essentially over - but we'll just keep going and let players see "host left"
    # For simplicity if host leaves, we destroy the room
    if is_host:
        global ACTIVE_ROOM
        # Notify everyone
        for pid, sockets in list(room.connections.items()):
            for ws in list(sockets):
                try:
                    await ws.send_json({"type": "host_left"})
                    await ws.close()
                except Exception:
                    pass
        room.connections.clear()
        if ACTIVE_ROOM is room:
            ACTIVE_ROOM = None
        return

    # If spy leaves during reveal/voting, the game should also end gracefully
    if room.spy_id == player_id and room.state in ("reveal", "voting", "spy_caught", "spy_guess"):
        # End game - spy quit
        room.state = "finished"
        room.most_voted_id = None
        return

    # If we're voting, recheck completion
    if room.state == "voting":
        # If they had voted, remove their vote count
        if was_voter and voted_for and voted_for in room.vote_results:
            room.vote_results[voted_for] = max(0, room.vote_results[voted_for] - 1)
        await _check_voting_complete(room)


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
