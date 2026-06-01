export type WsStatus = "connecting" | "connected" | "disconnected";

export type ChatWsMessage = {
  type: string;
  room_id?: string;
  message_id?: string;
  content?: string;
  sender_user_id?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
};

type UseChatWsParams = {
  getToken: () => string;
  getTenantID: () => string;
  getRoomID: () => string;
  apiBaseUrl: string;
  onMessage: (payload: ChatWsMessage) => void;
  onStatus: (status: WsStatus) => void;
  onError: (message: string) => void;
  onDebug: (line: string) => void;
};

export function useChatWebSocket(params: UseChatWsParams) {
  type SocketState = {
    socket: WebSocket;
    roomID: string;
    intentionalClose: boolean;
  };

  let socketState: SocketState | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingQueue: ChatWsMessage[] = [];
  const maxPendingMessages = 20;

  function wsUrl(roomID: string, token: string, tenantID: string): string {
    const base = params.apiBaseUrl.replace(/\/+$/, "");
    const wsBase = base.startsWith("https://")
      ? base.replace("https://", "wss://")
      : base.replace("http://", "ws://");
    const q = new URLSearchParams({ tenant_id: tenantID });
    if (token) q.set("token", token);
    return `${wsBase}/ws/chat/room/${roomID}?${q.toString()}`;
  }

  function debug(line: string) {
    params.onDebug(`[${new Date().toLocaleTimeString()}] ${line}`);
  }

  function sanitizeUrl(url: string): string {
    return url.replace(/token=[^&]+/, "token=***");
  }

  function clearReconnectTimer() {
    if (!reconnectTimer) return;
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  function closeCurrentSocket(reason: string) {
    if (!socketState) return;
    socketState.intentionalClose = true;
    socketState.socket.close();
    debug(reason);
    socketState = null;
  }

  function queueMessage(payload: ChatWsMessage) {
    const activeRoomID = params.getRoomID();
    if (payload.room_id && payload.room_id !== activeRoomID) {
      debug(`send dropped type=${payload.type} (stale room)`);
      return;
    }

    pendingQueue = [...pendingQueue.slice(-(maxPendingMessages - 1)), payload];
    debug(`queued type=${payload.type} (socket connecting)`);
  }

  function flushPendingQueue(state: SocketState) {
    const queued = pendingQueue;
    pendingQueue = [];

    for (const payload of queued) {
      if (socketState !== state || state.socket.readyState !== WebSocket.OPEN) {
        queueMessage(payload);
        return;
      }
      if (payload.room_id && payload.room_id !== state.roomID) {
        debug(`queued send skipped type=${payload.type} (stale room)`);
        continue;
      }
      state.socket.send(JSON.stringify(payload));
      debug(`sent queued type=${payload.type}`);
    }
  }

  function connect(roomID: string) {
    clearReconnectTimer();
    closeCurrentSocket("closed previous connection intentionally");
    pendingQueue = [];

    const token = params.getToken();
    const tenantID = params.getTenantID();

    if (!tenantID || !roomID) {
      params.onStatus("disconnected");
      params.onError("Missing tenant / room");
      debug(`connect blocked token=${!!token} tenant=${!!tenantID} room=${!!roomID}`);
      return;
    }

    params.onStatus("connecting");
    const url = wsUrl(roomID, token, tenantID);
    debug(`connecting ${sanitizeUrl(url)}`);
    const nextSocket = new WebSocket(url);
    const state: SocketState = {
      socket: nextSocket,
      roomID,
      intentionalClose: false,
    };
    socketState = state;

    nextSocket.onopen = () => {
      if (socketState !== state) return;
      debug("connected");
      params.onStatus("connected");
      flushPendingQueue(state);
    };

    nextSocket.onmessage = (event) => {
      if (socketState !== state) return;
      try {
        const payload = JSON.parse(event.data) as ChatWsMessage;
        debug(`recv type=${payload.type}`);
        params.onMessage(payload);
      } catch {
        debug("recv invalid json");
      }
    };

    nextSocket.onerror = () => {
      if (socketState !== state) return;
      params.onError("WebSocket connection error");
      debug("socket error");
    };

    nextSocket.onclose = (event) => {
      if (socketState !== state) return;
      params.onStatus("disconnected");
      debug(`closed code=${event.code} reason=${event.reason || "-"}`);
      if (!state.intentionalClose && event.code !== 1000) {
        params.onError(`WebSocket closed (code: ${event.code})`);
      }
      socketState = null;
      if (!state.intentionalClose) {
        reconnectTimer = setTimeout(() => connect(params.getRoomID()), 2000);
        debug("scheduled reconnect in 2s");
      }
    };
  }

  function send(payload: ChatWsMessage) {
    if (!socketState) {
      debug(`send dropped type=${payload.type} (socket not ready)`);
      return;
    }
    if (socketState.socket.readyState === WebSocket.CONNECTING) {
      queueMessage(payload);
      return;
    }
    if (socketState.socket.readyState !== WebSocket.OPEN) {
      debug(`send dropped type=${payload.type} (socket not open)`);
      return;
    }
    socketState.socket.send(JSON.stringify(payload));
    debug(`sent type=${payload.type}`);
  }

  function close() {
    clearReconnectTimer();
    pendingQueue = [];
    closeCurrentSocket("closed intentionally");
    params.onStatus("disconnected");
  }

  return { connect, send, close };
}
