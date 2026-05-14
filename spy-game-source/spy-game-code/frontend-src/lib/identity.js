// Per-tab identity using sessionStorage.
// Why sessionStorage? Each tab has its own identity. Opening the invite link in a new
// tab → fresh identity → user must enter name. Refresh in same tab → identity preserved.
const KEY = "spy_game_identity_v1";
const PID_KEY = "spy_player_id";

export function getOrCreatePlayerId() {
  let pid = sessionStorage.getItem(PID_KEY);
  if (!pid) {
    pid = "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    sessionStorage.setItem(PID_KEY, pid);
  }
  return pid;
}

export function setRoomIdentity({ roomId, name, isHost }) {
  sessionStorage.setItem(KEY, JSON.stringify({ roomId, name, isHost }));
}

export function getRoomIdentity() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearRoomIdentity() {
  sessionStorage.removeItem(KEY);
}

const DEVICE_KEY = "spy_device_pref";
export function getDevicePref() {
  return localStorage.getItem(DEVICE_KEY) || "mobile";
}
export function setDevicePref(pref) {
  localStorage.setItem(DEVICE_KEY, pref);
}
