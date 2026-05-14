import { useEffect, useRef, useState, useCallback } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function wsUrl(roomId, playerId) {
  const url = new URL(BACKEND_URL);
  const proto = url.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${url.host}/api/ws/${roomId}/${playerId}`;
}

export function useGameSocket({ roomId, playerId, name, onEvent }) {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [closeReason, setCloseReason] = useState(null);
  const wsRef = useRef(null);
  const nameRef = useRef(name);
  nameRef.current = name;

  const sendRef = useRef(null);

  const send = useCallback((obj) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(obj));
    }
  }, []);
  sendRef.current = send;

  useEffect(() => {
    if (!roomId || !playerId) return;
    let cancelled = false;
    let reconnectTimer = null;

    function connect() {
      if (cancelled) return;
      const ws = new WebSocket(wsUrl(roomId, playerId));
      wsRef.current = ws;
      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        ws.send(JSON.stringify({ type: "join", name: nameRef.current || "" }));
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "state") {
            setState(msg.data);
          } else {
            if (onEvent) onEvent(msg);
            if (["expired", "kicked", "name_taken", "game_started", "host_left"].includes(msg.type)) {
              setCloseReason(msg.type);
            }
          }
        } catch (err) {
          console.error("ws parse", err);
        }
      };
      ws.onclose = () => {
        setConnected(false);
        if (cancelled) return;
        // attempt reconnect unless explicit close
        if (!closeReason) {
          reconnectTimer = setTimeout(connect, 1500);
        }
      };
      ws.onerror = () => {
        try { ws.close(); } catch (_) {}
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const ws = wsRef.current;
      if (ws) {
        try { ws.close(); } catch (_) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, playerId]);

  return { state, connected, send, closeReason, setCloseReason };
}
