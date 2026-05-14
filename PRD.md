# لعبة الجاسوس (Spy Game Online) — PRD

## Problem Statement
Online multiplayer Arabic "Spy Game" (لعبة الجاسوس). One player creates a room (host = SASUKE 👑) and shares the link; up to ~12 friends join in real time. Once 3+ players, host starts, picks a category (12 options × 200 Arabic words each). A random non-host player becomes the spy who doesn't see the word. Players discuss & vote to identify the spy. Voting result → spy gets 30-word grid to guess the actual word. Final reveal screen.

## Architecture
- **Frontend**: React 19 + react-router-dom v7, Tailwind, Shadcn UI (Drawer, Sonner). Mobile-first RTL Arabic UI. Dark noir aesthetic (`#0B0C10` background, red `#DC2626` primary, gold `#FDE047` host accent). Fonts: Kufam (display) + Tajawal (body).
- **Backend**: FastAPI + WebSocket. Single-active-room model (in-memory). All API routes prefixed with `/api`. WebSocket at `/api/ws/{room_id}/{player_id}`.
- **Persistence**: Player identity (player_id, name, roomId) saved in `localStorage` → refresh keeps role/state. MongoDB used for nothing in this MVP (room state in-memory; intentional).
- **Real-time**: One WebSocket per player; server broadcasts personalized state after each event (state, role, word, votes, etc.).

## Game States
`lobby` → `category` → `reveal` → `voting` → `spy_caught` → `spy_guess` → `finished`

## Implemented (Feb 2026 — initial MVP)
- Create room with random 6-char Room ID; old room invalidated when new one is created (others see "انتهت صلاحية الرابط")
- Join via link with unique-name check (rejects duplicates)
- Host pinned with crown 👑; live ordered player list with connect status
- Copy invite link with success toast
- Start game enabled at ≥3 players (host only)
- 12 categories × ~200 unique Arabic words (`backend/words.py`)
- Random spy assignment from non-host players; word reveal screen (civilian sees word in gold; spy sees red "أنت الجاسوس" pulse card)
- Host starts voting; players vote once; live counter `voted/total`; vote log "صوّت X على Y"
- Auto-tally when all players voted; majority chosen (ties broken randomly); spy-caught state shows result
- 30-word grid for spy guess; finished state shows guess + spy name
- Settings drawer (host): kick player + restart game; kicked player sees "تم طردك من اللعبة"
- Leave game → "لقد غادرت اللعبة" + redirect home
- Late joiner after game start → "اللعبة قد بدأت بالفعل"
- Host leaving destroys the room → others get "غادر الهوست"
- Refresh recovers player into same state via localStorage

## Core User Personas
- **Host (SASUKE)**: creates the game, controls flow (category, voting, kick, restart). Also plays as a civilian.
- **Players**: 2-11 friends joining via link, vote to find the spy.
- **Spy**: secretly assigned, must blend in by deducing the word from discussion.

## Backlog (P0 / P1 / P2)
- **P1**: Auto-end voting on WebSocket disconnect (not just explicit leave) to prevent stuck votes
- **P1**: Persist room history to MongoDB for replay/analytics
- **P2**: Custom categories upload by host
- **P2**: Sound effects + dramatic music for reveal/voting
- **P2**: Chat/timer during discussion phase
- **P2**: Spectator mode for late joiners
- **P2**: Win/lose scoring system (spy wins if not caught OR guesses word; civilians win if catch spy AND spy fails guess)

## Test Coverage
- Backend: 13/13 pytest tests (REST + WebSocket flows) — `/app/backend/tests/test_spy_game.py`
- Frontend: visual sanity check; ready for user playtest

## Tech Notes
- Single-room model is intentional for MVP simplicity ("if new room created, old one cancelled"). Future scaling would require Redis pub/sub or similar.
- All times in `datetime.now(timezone.utc)` and stored as ISO strings.
- Names normalized via `.strip().lower()` for uniqueness check; display preserves original casing.
